// cosineSimilarity está duplicada conscientemente em relação a server/utils/embeddings.ts:
// é matemática pura (~6 linhas, nunca muda), e acoplamento com a squad de IA
// teria custo permanente — mudanças neles poderiam quebrar nosso registro de perguntas.
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0
    const bi = b[i] ?? 0
    dot += ai * bi
    normA += ai * ai
    normB += bi * bi
  }
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
  if (magnitude === 0) return 0
  return dot / magnitude
}

// Parâmetro de tuning — calibrar com dados reais:
//   perguntas diferentes sendo agrupadas → subir (0.93, 0.95…)
//   paráfrases da mesma pergunta ficando separadas → descer (0.90, 0.88…)
export const THRESHOLD_MESMA_PERGUNTA = 0.92
