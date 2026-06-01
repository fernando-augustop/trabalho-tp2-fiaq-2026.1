// Lê o inventário de links do FAQ (data/sources/faq-cic-unb/02-links.md) e:
//  1) Gera data/faq/faq-links.json — registro de TODOS os links externos,
//     agrupados por contexto, para o bot oferecer "para mais informações: [link]".
//  2) Crawleia as páginas HTML institucionais (fetch + extração de texto) e
//     salva em data/crawl/<slug>.md para serem indexadas pelo RAG.
//
// Sem dependências externas (usa fetch nativo do Node). Uso: node scripts/fetch-links.mjs

import { readFile, writeFile, readdir, unlink, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SOURCES_DIR = join(ROOT, 'data', 'sources', 'faq-cic-unb')
const LINKS_MD = join(SOURCES_DIR, '02-links.md')
const CRAWL_DIR = join(ROOT, 'data', 'crawl')

// Domínios/padrões cujo conteúdo NÃO é útil crawlear (mas entram no registro de links).
const SKIP_FETCH = [
  /instagram\.com/i, /facebook\.com/i, /(^|\/\/)x\.com/i, /youtu\.?be/i, /linktr\.ee/i,
  /sigaa\.unb\.br/i,   // portais JSF dinâmicos / login
  /sei\.unb\.br/i, /portalsig\.unb\.br\/?$/i,
  /github\.com/i,
]
const IS_PDF = /\.pdf($|\?)/i
const IS_FAQ_ANCHOR = /cic\.unb\.br\/informacoes\/faq#/i

function parseLinksTable(md) {
  const rows = []
  for (const line of md.split('\n')) {
    if (!line.startsWith('|')) continue
    const cols = line.split('|').map(c => c.trim())
    // | # | Texto | URL | Contexto | Ocorrências |  -> cols[1..5]
    if (cols.length < 6) continue
    const num = cols[1]
    if (!/^\d+$/.test(num)) continue // pula cabeçalho/separador
    const texto = cols[2]
    const url = cols[3]
    const contexto = cols[4].replace(/`/g, '').trim() || 'geral'
    if (!/^https?:\/\//i.test(url)) continue
    rows.push({ texto, url, contexto })
  }
  return rows
}

function slugify(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .toLowerCase()
}

function htmlToText(html) {
  let body = html
  const main =
    html.match(/<main\b[\s\S]*?<\/main>/i) ||
    html.match(/<article\b[\s\S]*?<\/article>/i) ||
    html.match(/<div[^>]*(?:id|class)="[^"]*(?:content|conteudo|entry|post)[^"]*"[\s\S]*?<\/div>/i)
  if (main) body = main[0]

  return body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .split('\n').map(l => l.trim()).filter(Boolean).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function getTitle(html) {
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  return t ? t[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : ''
}

async function fetchPage(url) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 25000)
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; fIAq-bot/1.0)' },
    })
    if (!res.ok) return { ok: false, status: res.status }
    const html = await res.text()
    return { ok: true, finalUrl: res.url || url, title: getTitle(html), text: htmlToText(html) }
  } catch (e) {
    return { ok: false, error: String(e.message || e) }
  } finally {
    clearTimeout(timer)
  }
}

function buildRegistry(rows) {
  // só links externos (exclui as âncoras do próprio FAQ)
  const byContext = new Map()
  for (const r of rows) {
    if (IS_FAQ_ANCHOR.test(r.url)) continue
    const key = r.contexto
    if (!byContext.has(key)) byContext.set(key, new Map())
    const m = byContext.get(key)
    if (!m.has(r.url)) m.set(r.url, r.texto) // dedupe por url
  }

  const entries = []
  for (const [contexto, m] of byContext) {
    const legivel = contexto.replace(/-/g, ' ')
    const bullets = [...m.entries()].map(([url, texto]) => `- [${texto}](${url})`).join('\n')
    entries.push({
      id: `links-${contexto}`,
      titulo: `Links úteis sobre ${legivel}`,
      conteudo: `Para mais informações sobre ${legivel}, acesse os links oficiais:\n${bullets}`,
      url: `https://www.cic.unb.br/informacoes/faq#${contexto}`,
    })
  }
  return entries
}

async function main() {
  const md = await readFile(LINKS_MD, 'utf-8')
  const rows = parseLinksTable(md)
  console.log(`Inventário: ${rows.length} ocorrências de links.`)

  // 1) registro de links (proveniência — NÃO é indexado no RAG, para não
  //    poluir o contexto do modelo. Os links chegam ao aluno via chips de Fonte.)
  const registry = buildRegistry(rows)
  await writeFile(join(SOURCES_DIR, 'links-registry.json'), JSON.stringify(registry, null, 2) + '\n', 'utf-8')
  console.log(`Registro: links-registry.json com ${registry.length} grupos de contexto.`)

  // 2) crawl das páginas HTML
  await mkdir(CRAWL_DIR, { recursive: true })
  for (const f of await readdir(CRAWL_DIR).catch(() => [])) {
    if (f.endsWith('.md')) await unlink(join(CRAWL_DIR, f))
  }

  const seen = new Set()
  const toFetch = []
  for (const r of rows) {
    if (IS_FAQ_ANCHOR.test(r.url) || IS_PDF.test(r.url)) continue
    if (SKIP_FETCH.some(re => re.test(r.url))) continue
    if (seen.has(r.url)) continue
    seen.add(r.url)
    toFetch.push(r)
  }
  console.log(`Crawl: ${toFetch.length} páginas HTML a buscar...\n`)

  let ok = 0, fail = 0
  for (const r of toFetch) {
    const res = await fetchPage(r.url)
    if (!res.ok || !res.text || res.text.length < 200) {
      fail++
      console.log(`  SKIP ${r.url} (${res.status || res.error || 'conteúdo curto'})`)
      continue
    }
    const title = res.title || r.texto
    const front = `---\ntitle: ${title.replace(/\n/g, ' ')}\nurl: ${r.url}\ncontexto: ${r.contexto}\n---\n\n`
    await writeFile(join(CRAWL_DIR, slugify(r.url) + '.md'), front + res.text, 'utf-8')
    ok++
    console.log(`  OK   ${r.url} (${res.text.length} chars)`)
  }

  console.log(`\nCrawl concluído: ${ok} páginas salvas, ${fail} ignoradas.`)
}

main().catch(err => { console.error(err); process.exit(1) })
