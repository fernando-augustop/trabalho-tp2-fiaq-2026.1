import { getSql, isDatabaseConfigured } from '../db/index'
import { topKFiltered } from '../utils/vectorStore'

const VECTOR_DIM = 2048

export interface SearchResult {
  id: string
  titulo: string
  conteudo: string
  url: string
  score: number
}

interface RagSearchRow {
  id: string
  titulo: string
  conteudo: string
  url: string | null
  score: number
}

function toVectorLiteral(vector: number[]): string | null {
  if (vector.length !== VECTOR_DIM || !vector.every(Number.isFinite)) {
    return null
  }

  return `[${vector.join(',')}]`
}

export async function buscarRagNoBanco(
  queryVector: number[],
  modeloEmbedding: string,
  k = 5,
  minScore = 0.45
): Promise<SearchResult[] | null> {
  if (!isDatabaseConfigured()) return null

  const vectorLiteral = toVectorLiteral(queryVector)
  if (!vectorLiteral) {
    console.warn(
      `[RAG] Vetor de consulta tem ${queryVector.length} dimensões; `
      + `o banco espera ${VECTOR_DIM}. Usando fallback JSON.`
    )
    return null
  }

  const sql = getSql()
  const rows = await sql<RagSearchRow[]>`
    SELECT id, titulo, conteudo, url, score
    FROM buscar_rag_chunks(
      ${vectorLiteral}::extensions.vector(2048),
      ${modeloEmbedding},
      ${minScore},
      ${k}
    )
  `

  return rows.map(row => ({
    id: row.id,
    titulo: row.titulo,
    conteudo: row.conteudo,
    url: row.url ?? '',
    score: Number(row.score)
  }))
}

export async function buscarRag(
  queryVector: number[],
  modeloEmbedding: string,
  k = 5,
  minScore = 0.45
): Promise<{ results: SearchResult[], source: 'database' | 'json' }> {
  try {
    const dbResults = await buscarRagNoBanco(queryVector, modeloEmbedding, k, minScore)
    if (dbResults?.length) {
      return { results: dbResults, source: 'database' }
    }
  } catch (error) {
    console.warn('[RAG] Falha na busca vetorial do banco; usando fallback JSON:', error)
  }

  return {
    results: topKFiltered(queryVector, k, minScore),
    source: 'json'
  }
}
