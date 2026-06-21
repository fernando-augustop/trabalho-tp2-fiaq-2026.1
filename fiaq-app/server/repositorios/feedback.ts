import { getSql, isDatabaseConfigured } from '../db/index'

export type RespostaFeedback = 'helpful' | 'unhelpful'

interface RegistrarAvaliacaoInput {
  pergunta: string
  resposta: string
  avaliacao: RespostaFeedback
  fontesUsadas: unknown[]
  acionouBuscaWeb: boolean
}

export async function registrarAvaliacaoResposta(input: RegistrarAvaliacaoInput): Promise<void> {
  if (!isDatabaseConfigured()) return

  const pergunta = input.pergunta.trim()
  const resposta = input.resposta.trim()
  if (!pergunta || !resposta) return

  const sql = getSql()

  try {
    const fontesUsadas = Array.isArray(input.fontesUsadas) ? input.fontesUsadas : []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fontesJson = sql.json(fontesUsadas as any)

    await sql`
      INSERT INTO avaliacao_resposta
        (pergunta, resposta, avaliacao, fontes_usadas, acionou_busca_web)
      VALUES (
        ${pergunta},
        ${resposta},
        ${input.avaliacao},
        ${fontesJson},
        ${input.acionouBuscaWeb}
      )
    `
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[feedback] Não foi possível registrar avaliação da resposta: ${message}`)
  }
}
