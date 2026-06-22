import { getSql, isDatabaseConfigured } from '../db/index'
import { normalizarTexto } from '../utils-perguntas/normalizar'
import { cosineSimilarity, THRESHOLD_MESMA_PERGUNTA } from '../utils-perguntas/similaridade'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as JsonValue
}

// Registra uma pergunta feita ao chatbot de forma anônima e agregada.
// Parâmetros vindos do chat.post.ts após o streaming ser concluído com sucesso:
//   embedding        — vetor já gerado pelo chat (não gerar um segundo embedding)
//   modeloEmbedding  — modelo que gerou o vetor (embedInfo.model do llmProvider)
//   fontesUsadas     — chunks RAG retornados pelo banco/pgvector ou fallback JSON
export async function registrarPergunta(
  textoOriginal: string,
  embedding: number[],
  modeloEmbedding: string,
  respostaGerada: string,
  fontesUsadas: unknown[]
): Promise<void> {
  if (!isDatabaseConfigured()) return

  const sql = getSql()

  // a. Busca todas as perguntas do MESMO modelo fora da transação.
  //    Vetores de modelos diferentes não são comparáveis entre si.
  const existentes = await sql<{ id: number, embedding: number[] }[]>`
    SELECT id, embedding
    FROM pergunta_registrada
    WHERE modelo_embedding = ${modeloEmbedding}
  `

  // b. Encontra a pergunta de maior similaridade com o vetor novo.
  let melhorId: number | null = null
  let melhorScore = -1

  for (const row of existentes) {
    const score = cosineSimilarity(embedding, row.embedding as number[])
    if (score > melhorScore) {
      melhorScore = score
      melhorId = row.id
    }
  }

  const fontesJson = sql.json(toJsonValue(fontesUsadas))

  if (melhorScore >= THRESHOLD_MESMA_PERGUNTA && melhorId !== null) {
    // c. Pergunta já existe — incrementa contador e registra a ocorrência.
    await sql.begin(async (tx) => {
      await tx`
        UPDATE pergunta_registrada
        SET total_vezes = total_vezes + 1,
            dthr_ultima = CURRENT_TIMESTAMP
        WHERE id = ${melhorId}
      `
      await tx`
        INSERT INTO ocorrencia_pergunta (id_pergunta_registrada, resposta_gerada, fontes_usadas)
        VALUES (${melhorId}, ${respostaGerada}, ${fontesJson})
      `
    })
  } else {
    // d. Pergunta nova — insere o registro agregado e a primeira ocorrência.
    //
    // Limitação aceita: sem lock entre o SELECT acima e este INSERT. Em carga
    // muito concorrente, duas perguntas idênticas simultâneas podem criar
    // registros duplicados. Para análise de tendências isso é tolerável;
    // serialização via lock não compensa a complexidade agora.
    await sql.begin(async (tx) => {
      const rows = await tx<{ id: number }[]>`
        INSERT INTO pergunta_registrada
          (texto_original, texto_normalizado, embedding, modelo_embedding)
        VALUES (
          ${textoOriginal},
          ${normalizarTexto(textoOriginal)},
          ${sql.json(toJsonValue(embedding))},
          ${modeloEmbedding}
        )
        RETURNING id
      `
      // RETURNING sempre retorna exatamente uma linha num INSERT bem-sucedido.
      const novoId = rows[0]!.id
      await tx`
        INSERT INTO ocorrencia_pergunta (id_pergunta_registrada, resposta_gerada, fontes_usadas)
        VALUES (${novoId}, ${respostaGerada}, ${fontesJson})
      `
    })
  }
}

// Retorna as perguntas com maior contador total de ocorrências.
export async function listarMaisFrequentes(limite = 10) {
  if (!isDatabaseConfigured()) return []

  const sql = getSql()

  return sql<{ id: number, texto_original: string, total_vezes: number, dthr_ultima: Date }[]>`
    SELECT id, texto_original, total_vezes, dthr_ultima
    FROM pergunta_registrada
    ORDER BY total_vezes DESC
    LIMIT ${limite}
  `
}

// Retorna perguntas com mais ocorrências nos últimos N dias.
// Útil para detectar picos sazonais (ex: matrícula em período de matrícula).
export async function listarEmAlta(dias = 7, limite = 5) {
  if (!isDatabaseConfigured()) return []

  const sql = getSql()

  return sql<{ texto_original: string, total_no_periodo: number, total_geral: number }[]>`
    SELECT
      pr.texto_original,
      COUNT(op.id)::int  AS total_no_periodo,
      pr.total_vezes     AS total_geral
    FROM pergunta_registrada pr
    JOIN ocorrencia_pergunta op ON op.id_pergunta_registrada = pr.id
    WHERE op.dthr_ocorrencia >= NOW() - (${dias} * INTERVAL '1 day')
    GROUP BY pr.id, pr.texto_original, pr.total_vezes
    ORDER BY total_no_periodo DESC
    LIMIT ${limite}
  `
}
