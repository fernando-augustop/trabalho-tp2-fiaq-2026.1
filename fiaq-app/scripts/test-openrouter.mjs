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
const DEFAULT_CHAT_MODEL = 'google/gemma-4-31b-it:free'
const DEFAULT_FALLBACK_CHAT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free,nvidia/nemotron-3-super-120b-a12b:free'
const ROUTER_CHAT_MODEL = 'openrouter/free'
const COMPATIBLE_EMBED_MODEL = 'nvidia/llama-nemotron-embed-vl-1b-v2:free'
const CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL || DEFAULT_CHAT_MODEL
const FALLBACK_CHAT_MODELS = process.env.OPENROUTER_CHAT_FALLBACK_MODELS || DEFAULT_FALLBACK_CHAT_MODEL
const RAW_EMBED_MODEL = process.env.OPENROUTER_EMBED_MODEL || COMPATIBLE_EMBED_MODEL
const CHAT_ONLY_MODELS = new Set([ROUTER_CHAT_MODEL, CHAT_MODEL, ...FALLBACK_CHAT_MODELS.split(',').map(model => model.trim()).filter(Boolean)])
const EMBED_MODEL = CHAT_ONLY_MODELS.has(RAW_EMBED_MODEL) ? COMPATIBLE_EMBED_MODEL : RAW_EMBED_MODEL

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
if (CHAT_ONLY_MODELS.has(RAW_EMBED_MODEL)) {
  console.log(`⚠️  ${RAW_EMBED_MODEL} é modelo de chat; embeddings serão testados com ${COMPATIBLE_EMBED_MODEL}.\n`)
}

// ── 1) Chat ──────────────────────────────────────────────────────────────────
console.log(`💬 Testando CHAT (${CHAT_MODEL})…`)
try {
  const r = await fetch(`${URL_BASE}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0.2,
      max_tokens: 120,
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
