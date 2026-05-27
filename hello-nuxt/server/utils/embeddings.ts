import { embed } from './ollama'

export interface EmbeddedChunk {
  id: string
  titulo: string
  conteudo: string
  url: string
  vector: number[]
}

// Cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let magA = 0
  let magB = 0

  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0
    const bi = b[i] ?? 0
    dot += ai * bi
    magA += ai * ai
    magB += bi * bi
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB)
  if (magnitude === 0) return 0
  return dot / magnitude
}

// Embed a FAQ entry and return it with its vector
export async function embedChunk(chunk: Omit<EmbeddedChunk, 'vector'>): Promise<EmbeddedChunk> {
  // We embed titulo + conteudo together for better retrieval
  const text = `${chunk.titulo}\n${chunk.conteudo}`
  const vector = await embed(text)
  return { ...chunk, vector }
}

// Embed the user's query for similarity search
export async function embedQuery(query: string): Promise<number[]> {
  return embed(query)
}
