import { type EmbeddedChunk, cosineSimilarity } from './embeddings'

export interface SearchResult {
  id: string
  titulo: string
  conteudo: string
  url: string
  score: number
}

// In-memory store — populated at boot by bootstrap-rag.ts
const store: EmbeddedChunk[] = []

export function addChunk(chunk: EmbeddedChunk): void {
  store.push(chunk)
}

export function getStoreSize(): number {
  return store.length
}

// Find the K most similar chunks to a query vector
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

// Only return results above a minimum similarity threshold
// Prevents the LLM from getting irrelevant context
export function topKFiltered(queryVector: number[], k = 4, minScore = 0.5): SearchResult[] {
  return topK(queryVector, k).filter(r => r.score >= minScore)
}
