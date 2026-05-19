export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.messages || !Array.isArray(body.messages)) {
    throw createError({ statusCode: 400, message: 'INVALID_PAYLOAD' })
  }

  await new Promise(r => setTimeout(r, 1200))

  const lastUserMessage = [...body.messages].reverse().find((m: any) => m.role === 'user')

  return {
    reply: `[MOCK] Recebi sua pergunta: "${lastUserMessage?.content}". O backend real com Ollama ainda está em desenvolvimento.`
  }
})
