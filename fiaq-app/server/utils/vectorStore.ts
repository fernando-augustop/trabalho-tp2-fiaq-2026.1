import { type ChunkKind, type EmbeddedChunk, cosineSimilarity } from './embeddings'

export interface SearchResult {
  id: string
  titulo: string
  conteudo: string
  url: string
  score: number
}

// O FAQ curado tem prioridade sobre PDFs e páginas crawleadas: ganha um pequeno
// boost para não ser afogado pelo conteúdo (mais volumoso e ruidoso) do crawl.
const KIND_BOOST: Record<ChunkKind, number> = {
  faq: 0.06,
  pdf: 0.02,
  crawl: 0,
}

const store: EmbeddedChunk[] = []

export function addChunk(chunk: EmbeddedChunk): void {
  store.push(chunk)
}

// Carrega vários chunks de uma vez (usado ao hidratar o índice pré-computado).
export function loadChunks(chunks: EmbeddedChunk[]): void {
  store.push(...chunks)
}

// Retorna todos os chunks indexados (usado para serializar o índice).
export function getAllChunks(): EmbeddedChunk[] {
  return store
}

export function getStoreSize(): number {
  return store.length
}

export function topK(queryVector: number[], k = 4): SearchResult[] {
  if (store.length === 0) return []

  return store
    .map(chunk => ({
      id: chunk.id,
      titulo: chunk.titulo,
      conteudo: chunk.conteudo,
      url: chunk.url,
      score: cosineSimilarity(queryVector, chunk.vector) + (KIND_BOOST[chunk.kind] ?? 0)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

export function topKFiltered(queryVector: number[], k = 4, minScore = 0.5): SearchResult[] {
  return topK(queryVector, k).filter(r => r.score >= minScore)
}
