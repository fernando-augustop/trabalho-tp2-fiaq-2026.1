import { getSql, isDatabaseConfigured } from '../db/index'
import { registrarCandidataWeb, temFonteWeb, type MotivoBuscaWeb } from './candidatos'

export type RespostaFeedback = 'helpful' | 'unhelpful'
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as JsonValue
}

interface RegistrarAvaliacaoInput {
  pergunta: string
  resposta: string
  avaliacao: RespostaFeedback
  fontesUsadas: unknown[]
  acionouBuscaWeb: boolean
  motivoBuscaWeb?: MotivoBuscaWeb
}

export async function registrarAvaliacaoResposta(input: RegistrarAvaliacaoInput): Promise<void> {
  if (!isDatabaseConfigured()) return

  const pergunta = input.pergunta.trim()
  const resposta = input.resposta.trim()
  if (!pergunta || !resposta) return

  const sql = getSql()

  try {
    const fontesUsadas = Array.isArray(input.fontesUsadas) ? input.fontesUsadas : []
    const fontesJson = sql.json(toJsonValue(fontesUsadas))

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

    if (
      input.avaliacao === 'helpful'
      && input.acionouBuscaWeb
      && input.motivoBuscaWeb
      && temFonteWeb(fontesUsadas)
    ) {
      await registrarCandidataWeb({
        pergunta,
        resposta,
        fontesUsadas,
        motivoBuscaWeb: input.motivoBuscaWeb
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[feedback] Não foi possível registrar avaliação da resposta: ${message}`)
  }
}
