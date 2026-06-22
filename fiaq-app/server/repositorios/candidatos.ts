import { createHash } from 'node:crypto'
import { getSql, isDatabaseConfigured } from '../db/index'
import { embed, embedInfo } from '../utils/llmProvider'

// O schema RAG usa extensions.vector(2048). Aprovações de curadoria precisam
// manter um modelo de embedding com essa dimensão.
const VECTOR_DIM = 2048
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export type MotivoBuscaWeb = 'fallback_automatico' | 'feedback_negativo'
export type StatusCandidato = 'pendente' | 'aprovada' | 'rejeitada'

export interface WebRespostaCandidata {
  id: number
  pergunta: string
  resposta: string
  fontes_usadas: unknown[]
  motivo_busca_web: MotivoBuscaWeb
  status: StatusCandidato
  aprovado_por: string | null
  aprovado_em: string | null
  rejeitado_por: string | null
  rejeitado_em: string | null
  observacao_admin: string | null
  id_rag_documento: number | null
  chunk_uid_rag: string | null
  dthr_criacao: string
  dthr_atualizacao: string
}

interface CandidataRow extends Omit<WebRespostaCandidata, 'fontes_usadas'> {
  fontes_usadas: unknown
}

interface CriarCandidataInput {
  pergunta: string
  resposta: string
  fontesUsadas: unknown[]
  motivoBuscaWeb: MotivoBuscaWeb
}

function checksum(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180)
}

function toVectorLiteral(vector: number[]): string {
  if (vector.length !== VECTOR_DIM || !vector.every(Number.isFinite)) {
    throw new Error(`Embedding com ${vector.length} dimensões; esperado ${VECTOR_DIM}.`)
  }

  return `[${vector.join(',')}]`
}

function normalizeRow(row: CandidataRow): WebRespostaCandidata {
  return {
    ...row,
    fontes_usadas: Array.isArray(row.fontes_usadas) ? row.fontes_usadas : []
  }
}

function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as JsonValue
}

export function temFonteWeb(fontesUsadas: unknown[]): boolean {
  return fontesUsadas.some((source) => {
    if (!source || typeof source !== 'object') return false
    const kind = 'kind' in source ? String(source.kind || '') : ''
    const url = 'url' in source ? String(source.url || '') : ''
    return kind === 'web' || /^https?:\/\//i.test(url)
  })
}

export async function registrarCandidataWeb(input: CriarCandidataInput): Promise<void> {
  if (!isDatabaseConfigured()) return

  const pergunta = input.pergunta.trim()
  const resposta = input.resposta.trim()
  if (!pergunta || !resposta || !temFonteWeb(input.fontesUsadas)) return

  const sql = getSql()
  const fontesJson = sql.json(toJsonValue(input.fontesUsadas))
  const dedupeChecksum = checksum(JSON.stringify({
    pergunta,
    resposta,
    fontes: input.fontesUsadas
  }))

  await sql`
    INSERT INTO web_resposta_candidata
      (pergunta, resposta, fontes_usadas, motivo_busca_web, checksum)
    VALUES (
      ${pergunta},
      ${resposta},
      ${fontesJson},
      ${input.motivoBuscaWeb},
      ${dedupeChecksum}
    )
    ON CONFLICT (checksum) DO UPDATE SET
      pergunta = EXCLUDED.pergunta,
      resposta = EXCLUDED.resposta,
      fontes_usadas = EXCLUDED.fontes_usadas,
      motivo_busca_web = EXCLUDED.motivo_busca_web,
      dthr_atualizacao = CURRENT_TIMESTAMP
  `
}

export async function listarCandidatas(status: StatusCandidato | 'todas' = 'pendente'): Promise<WebRespostaCandidata[]> {
  const sql = getSql()
  const rows = status === 'todas'
    ? await sql<CandidataRow[]>`
        SELECT *
        FROM web_resposta_candidata
        ORDER BY dthr_criacao DESC
        LIMIT 100
      `
    : await sql<CandidataRow[]>`
        SELECT *
        FROM web_resposta_candidata
        WHERE status = ${status}
        ORDER BY dthr_criacao DESC
        LIMIT 100
      `

  return rows.map(normalizeRow)
}

export async function contarCandidatas(): Promise<Record<StatusCandidato, number>> {
  const sql = getSql()
  const rows = await sql<{ status: StatusCandidato, total: number }[]>`
    SELECT status, count(*)::int AS total
    FROM web_resposta_candidata
    GROUP BY status
  `

  return {
    pendente: rows.find(row => row.status === 'pendente')?.total ?? 0,
    aprovada: rows.find(row => row.status === 'aprovada')?.total ?? 0,
    rejeitada: rows.find(row => row.status === 'rejeitada')?.total ?? 0
  }
}

export async function rejeitarCandidata(id: number, adminEmail: string, observacao?: string): Promise<void> {
  const sql = getSql()
  await sql`
    UPDATE web_resposta_candidata
    SET status = 'rejeitada',
        rejeitado_por = ${adminEmail},
        rejeitado_em = CURRENT_TIMESTAMP,
        observacao_admin = ${observacao || null},
        dthr_atualizacao = CURRENT_TIMESTAMP
    WHERE id = ${id}
      AND status = 'pendente'
  `
}

export async function aprovarCandidata(id: number, adminEmail: string, observacao?: string): Promise<WebRespostaCandidata> {
  const sql = getSql()
  const rows = await sql<CandidataRow[]>`
    SELECT *
    FROM web_resposta_candidata
    WHERE id = ${id}
    LIMIT 1
  `
  const candidata = rows[0] ? normalizeRow(rows[0]) : null

  if (!candidata) {
    throw createError({ statusCode: 404, message: 'CANDIDATE_NOT_FOUND' })
  }

  if (candidata.status === 'aprovada') return candidata
  if (candidata.status !== 'pendente') {
    throw createError({ statusCode: 409, message: 'CANDIDATE_ALREADY_REVIEWED' })
  }

  const source = candidata.fontes_usadas.find(item => item && typeof item === 'object') as Record<string, unknown> | undefined
  const sourceUrl = source?.url ? String(source.url) : ''
  const documentSlug = `admin-web-${id}-${slugify(candidata.pergunta)}`.slice(0, 240)
  const chunkUid = `${documentSlug}-1`
  const content = [
    `Pergunta validada: ${candidata.pergunta}`,
    `Resposta validada: ${candidata.resposta}`
  ].join('\n\n')
  const vector = toVectorLiteral(await embed(`${candidata.pergunta}\n${candidata.resposta}`))

  const updated = await sql.begin(async (tx) => {
    const [ragDocument] = await tx<{ id: number }[]>`
      INSERT INTO rag_documento
        (origem, slug, titulo, url_fonte, caminho_origem, checksum, metadados, ativo, dthr_atualizacao)
      VALUES (
        'crawl',
        ${documentSlug},
        ${candidata.pergunta.slice(0, 500)},
        ${sourceUrl || null},
        ${`admin/web_resposta_candidata/${id}`},
        ${checksum(content)},
        ${tx.json({
          tipo: 'admin_web_validado',
          candidataId: id,
          aprovadoPor: adminEmail,
          fontes: toJsonValue(candidata.fontes_usadas)
        })},
        TRUE,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (slug) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        url_fonte = EXCLUDED.url_fonte,
        checksum = EXCLUDED.checksum,
        metadados = EXCLUDED.metadados,
        ativo = TRUE,
        dthr_atualizacao = CURRENT_TIMESTAMP
      RETURNING id
    `

    if (!ragDocument) {
      throw new Error('RAG_DOCUMENT_NOT_CREATED')
    }

    await tx`
      INSERT INTO rag_chunk
        (
          id_documento,
          id_faq_entrada,
          origem,
          chunk_uid,
          ordem,
          titulo,
          conteudo,
          url_fonte,
          metadados,
          provedor_embedding,
          modelo_embedding,
          embedding,
          ativo,
          dthr_atualizacao
        )
      VALUES (
        ${ragDocument.id},
        NULL,
        'crawl',
        ${chunkUid},
        1,
        ${candidata.pergunta.slice(0, 500)},
        ${content},
        ${sourceUrl || null},
        ${tx.json({ tipo: 'admin_web_validado', candidataId: id })},
        ${embedInfo.provider},
        ${embedInfo.model},
        ${vector}::extensions.vector(2048),
        TRUE,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (chunk_uid) DO UPDATE SET
        id_documento = EXCLUDED.id_documento,
        titulo = EXCLUDED.titulo,
        conteudo = EXCLUDED.conteudo,
        url_fonte = EXCLUDED.url_fonte,
        metadados = EXCLUDED.metadados,
        provedor_embedding = EXCLUDED.provedor_embedding,
        modelo_embedding = EXCLUDED.modelo_embedding,
        embedding = EXCLUDED.embedding,
        ativo = TRUE,
        dthr_atualizacao = CURRENT_TIMESTAMP
    `

    const [row] = await tx<CandidataRow[]>`
      UPDATE web_resposta_candidata
      SET status = 'aprovada',
          aprovado_por = ${adminEmail},
          aprovado_em = CURRENT_TIMESTAMP,
          observacao_admin = ${observacao || null},
          id_rag_documento = ${ragDocument.id},
          chunk_uid_rag = ${chunkUid},
          dthr_atualizacao = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (!row) {
      throw new Error('CANDIDATE_NOT_UPDATED')
    }

    return normalizeRow(row)
  })

  return updated
}
