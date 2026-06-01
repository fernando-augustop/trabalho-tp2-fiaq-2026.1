// Testa a key do OpenRouter contra os endpoints de chat e embeddings.
// Uso: node scripts/test-openrouter.mjs   (a partir de fiaq-app/)
import { readFileSync } from 'node:fs'

// Carrega o .env manualmente (script standalone não passa pelo Nitro).
function loadEnv() {
  try {
    const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
      if (m && !line.trim().startsWith('#')) process.env[m[1]] ??= m[2]
    }
  } catch { /* sem .env */ }
}
loadEnv()

const URL_BASE = 'https://openrouter.ai/api/v1'
const KEY = process.env.OPENROUTER_API_KEY
const CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL || 'openrouter/owl-alpha'
const EMBED_MODEL = process.env.OPENROUTER_EMBED_MODEL || 'nvidia/llama-nemotron-embed-vl-1b-v2:free'

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${KEY}`,
  'HTTP-Referer': 'http://localhost:3000',
  'X-Title': 'fIAq'
}

if (!KEY || KEY === 'COLE_SUA_KEY_AQUI') {
  console.error('❌ Defina OPENROUTER_API_KEY no arquivo .env primeiro.')
  process.exit(1)
}

console.log('🔑 Key detectada:', KEY.slice(0, 12) + '…\n')

// ── 1) Chat ──────────────────────────────────────────────────────────────────
console.log(`💬 Testando CHAT (${CHAT_MODEL})…`)
try {
  const r = await fetch(`${URL_BASE}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [{ role: 'user', content: 'Responda apenas: ok' }]
    })
  })
  const text = await r.text()
  if (!r.ok) {
    console.log(`   ❌ HTTP ${r.status}: ${text}\n`)
  } else {
    const j = JSON.parse(text)
    console.log(`   ✅ Resposta: ${JSON.stringify(j.choices?.[0]?.message?.content)}\n`)
  }
} catch (e) {
  console.log(`   ❌ Erro: ${e.message}\n`)
}

// ── 2) Embeddings ──────────────────────────────────────────────────────────────
console.log(`🧬 Testando EMBEDDINGS (${EMBED_MODEL})…`)
try {
  const r = await fetch(`${URL_BASE}/embeddings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: EMBED_MODEL, input: 'teste de embedding' })
  })
  const text = await r.text()
  if (!r.ok) {
    console.log(`   ❌ HTTP ${r.status}: ${text}`)
    console.log('   ⚠️  Se o endpoint /embeddings não for suportado, mantenha')
    console.log('       EMBED_PROVIDER=ollama no .env (embeddings local) e use')
    console.log('       OpenRouter só para o chat.\n')
  } else {
    const j = JSON.parse(text)
    const vec = j.data?.[0]?.embedding
    console.log(`   ✅ Embedding OK — dimensão: ${Array.isArray(vec) ? vec.length : '??'}\n`)
  }
} catch (e) {
  console.log(`   ❌ Erro: ${e.message}\n`)
}

console.log('Pronto.')
