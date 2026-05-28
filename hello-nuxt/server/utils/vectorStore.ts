import { type EmbeddedChunk, cosineSimilarity } from './embeddings'

export interface SearchResult {
  id: string
  titulo: string
  conteudo: string
  url: string
  score: number
}

const store: EmbeddedChunk[] = []

export function addChunk(chunk: EmbeddedChunk): void {
  store.push(chunk)
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
      score: cosineSimilarity(queryVector, chunk.vector)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

export function topKFiltered(queryVector: number[], k = 4, minScore = 0.5): SearchResult[] {
  return topK(queryVector, k).filter(r => r.score >= minScore)
}
