// Descobre fontes oficiais da UnB e, opcionalmente, materializa paginas HTML
// em data/crawl para entrarem no seed DB-first do RAG.
//
// Uso:
//   pnpm discover:unb
//   pnpm fetch:unb

import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SOURCE_DIR = join(ROOT, 'data', 'sources', 'unb-official')
const CRAWL_DIR = join(ROOT, 'data', 'crawl')
const CONFIG_PATH = join(SOURCE_DIR, 'seeds.json')
const BROWSER_USE_FINDINGS = join(SOURCE_DIR, 'browser-use-findings.json')
const DISCOVERED_JSON = join(SOURCE_DIR, 'discovered-sources.json')
const DISCOVERED_MD = join(SOURCE_DIR, 'discovered-sources.md')
const CRAWL_MANIFEST = join(SOURCE_DIR, 'crawl-files.json')

const args = new Set(process.argv.slice(2))
const WRITE_CRAWL = args.has('--write-crawl') || args.has('--crawl')
const MAX_PAGES = Number(process.env.UNB_DISCOVERY_LIMIT || 120)
const MAX_DEPTH = Number(process.env.UNB_DISCOVERY_DEPTH || 1)
const MAX_CRAWL = Number(process.env.UNB_CRAWL_LIMIT || 60)
const MIN_SCORE = Number(process.env.UNB_DISCOVERY_MIN_SCORE || 18)
const MIN_CHARS = Number(process.env.UNB_DISCOVERY_MIN_CHARS || 600)

const SKIP_EXTENSIONS = /\.(7z|avi|bmp|csv|docx?|gif|ico|jpe?g|mpe?g|mp4|ods|odt|png|pptx?|rar|svg|txt|webp|xlsx?|xml|zip)($|\?)/i
const SKIP_PATTERNS = [
  /\/administrator\b/i,
  /\/login\b/i,
  /\/logout\b/i,
  /\/feed\b/i,
  /format=feed/i,
  /tmpl=component/i,
  /whatsapp:/i,
  /mailto:/i,
  /tel:/i,
  /javascript:/i,
  /(^|\/\/)sig\.unb\.br/i,
  /sigaa\.unb\.br/i,
  /matriculaweb\.unb\.br/i,
  /sei\.unb\.br/i
]
const WEAK_PATTERNS = [
  /\/noticias?\b/i,
  /\/agenda\b/i,
  /\/eventos?\b/i,
  /\/component\//i,
  /\/search\b/i,
  /\/tags?\//i
]

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, ' ')
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeText(value) {
  return stripTags(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function slugify(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
    .toLowerCase()
}

function getTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  return match ? stripTags(match[1]) : ''
}

function htmlToText(html) {
  const main = html.match(/<main\b[\s\S]*?<\/main>/i)
    || html.match(/<article\b[\s\S]*?<\/article>/i)
    || html.match(/<div[^>]*(?:id|class)=["'][^"']*(?:content|conteudo|entry|post|main)[^"']*["'][\s\S]*?<\/div>/i)

  const body = main ? main[0] : html

  return decodeHtml(body)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|header|footer)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeUrl(raw, baseUrl) {
  if (!raw) return null
  const trimmed = raw.trim().replace(/&amp;/gi, '&')
  if (SKIP_PATTERNS.some(pattern => pattern.test(trimmed))) return null

  try {
    const parsed = new URL(trimmed, baseUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    if (parsed.hostname.toLowerCase() === 'unb.br') parsed.hostname = 'www.unb.br'
    parsed.hash = ''

    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|mc_)/i.test(key)) parsed.searchParams.delete(key)
    }

    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '')
    }

    return parsed.toString()
  } catch {
    return null
  }
}

function isOfficialUnb(url) {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host === 'unb.br' || host.endsWith('.unb.br')
  } catch {
    return false
  }
}

function shouldSkipUrl(url) {
  return !isOfficialUnb(url)
    || SKIP_EXTENSIONS.test(url)
    || SKIP_PATTERNS.some(pattern => pattern.test(url))
}

function extractLinks(html, baseUrl) {
  const links = []
  const regex = /<a\b[^>]*href\s*=\s*["']?([^"'\s>]+)[^>]*>([\s\S]*?)<\/a>/gi
  let match
  while ((match = regex.exec(html))) {
    const url = normalizeUrl(match[1], baseUrl)
    if (!url || shouldSkipUrl(url)) continue
    links.push({ url, text: stripTags(match[2]) })
  }
  return links
}

async function fetchHtml(url) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 25000)

  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; fIAq-source-discovery/1.0)'
      }
    })
    const contentType = res.headers.get('content-type') || ''
    if (!res.ok || !/html/i.test(contentType)) {
      return { ok: false, status: res.status, contentType }
    }

    const html = await res.text()
    return {
      ok: true,
      status: res.status,
      finalUrl: normalizeUrl(res.url || url, url) || url,
      title: getTitle(html),
      text: htmlToText(html),
      links: extractLinks(html, res.url || url)
    }
  } catch (error) {
    return { ok: false, error: String(error.message || error) }
  } finally {
    clearTimeout(timer)
  }
}

function scoreSource({ url, title = '', text = '', anchor = '', depth = 0, focusTerms = [] }) {
  const haystack = normalizeText(`${url} ${title} ${anchor} ${text.slice(0, 3500)}`)
  const matchedTerms = []

  for (const term of focusTerms) {
    const normalized = normalizeText(term)
    if (normalized && haystack.includes(normalized)) matchedTerms.push(term)
  }

  let score = Math.max(0, 35 - depth * 7)
  score += matchedTerms.length * 5

  if (/\/(estudante|perguntas-frequentes|calendario|matricula|graduacao|assistencia|biblioteca|acessibilidade|ouvidoria)\b/i.test(url)) {
    score += 18
  }
  if (/^(https:\/\/www\.unb\.br\/?$|https:\/\/www\.unb\.br\/estudante)/i.test(url)) score += 14
  if (text.length >= 2000) score += 6
  if (text.length < MIN_CHARS) score -= 14
  if (WEAK_PATTERNS.some(pattern => pattern.test(url))) score -= 18

  return {
    score,
    motivos: matchedTerms.slice(0, 8)
  }
}

function groupBy(items, getKey) {
  const groups = new Map()
  for (const item of items) {
    const key = getKey(item)
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  return groups
}

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return ''
  }
}

function sortByQuality(items) {
  return [...items].sort((a, b) => b.score - a.score || b.textLength - a.textLength)
}

function selectSources(pages) {
  const eligible = sortByQuality(
    pages.filter(page => page.score >= MIN_SCORE && page.textLength >= MIN_CHARS)
  )
  const selected = new Map()

  const add = (page) => {
    if (selected.size >= MAX_CRAWL || selected.has(page.url)) return
    selected.set(page.url, page)
  }

  // Primeiro garante cobertura tematica das sementes oficiais.
  for (const group of groupBy(eligible, page => page.categoria).values()) {
    for (const page of sortByQuality(group).slice(0, 2)) add(page)
  }

  // Depois garante que subdominios especializados tambem aparecam.
  for (const group of groupBy(eligible, page => hostOf(page.url)).values()) {
    add(sortByQuality(group)[0])
  }

  // Por fim preenche com as melhores paginas restantes.
  for (const page of eligible) add(page)

  return sortByQuality([...selected.values()])
}

async function loadConfig() {
  const raw = await readFile(CONFIG_PATH, 'utf-8')
  const config = JSON.parse(raw)
  return {
    seedUrls: config.seedUrls ?? [],
    focusTerms: config.focusTerms ?? []
  }
}

async function loadBrowserUseFindings() {
  try {
    const raw = await readFile(BROWSER_USE_FINDINGS, 'utf-8')
    const payload = JSON.parse(raw)
    const sources = Array.isArray(payload) ? payload : payload.sources
    if (!Array.isArray(sources)) return []

    return sources
      .map(source => ({
        url: normalizeUrl(source.url, 'https://www.unb.br/'),
        categoria: source.categoria || 'browser-use'
      }))
      .filter(source => source.url && !shouldSkipUrl(source.url))
  } catch {
    return []
  }
}

async function discover() {
  const config = await loadConfig()
  const browserUseSeeds = await loadBrowserUseFindings()
  const initialSeeds = [...config.seedUrls, ...browserUseSeeds]
  const queue = []
  const queued = new Set()

  for (const seed of initialSeeds) {
    const url = normalizeUrl(seed.url, 'https://www.unb.br/')
    if (!url || shouldSkipUrl(url) || queued.has(url)) continue
    queued.add(url)
    queue.push({ url, depth: 0, categoria: seed.categoria || 'geral', anchor: seed.categoria || '' })
  }

  const visited = new Set()
  const pages = []

  while (queue.length && visited.size < MAX_PAGES) {
    const item = queue.shift()
    if (!item || visited.has(item.url) || shouldSkipUrl(item.url)) continue
    visited.add(item.url)

    const res = await fetchHtml(item.url)
    if (!res.ok) {
      console.log(`SKIP ${item.url} (${res.status || res.error || res.contentType || 'falha'})`)
      continue
    }

    const scored = scoreSource({
      url: res.finalUrl,
      title: res.title,
      text: res.text,
      anchor: item.anchor,
      depth: item.depth,
      focusTerms: config.focusTerms
    })

    pages.push({
      url: res.finalUrl,
      title: res.title || item.categoria || res.finalUrl,
      categoria: item.categoria,
      depth: item.depth,
      score: scored.score,
      motivos: scored.motivos,
      textLength: res.text.length,
      text: res.text
    })

    console.log(`OK   ${res.finalUrl} (score ${scored.score}, ${res.text.length} chars)`)

    if (item.depth >= MAX_DEPTH) continue

    for (const link of res.links) {
      if (queued.has(link.url) || visited.has(link.url)) continue
      const linkScore = scoreSource({
        url: link.url,
        anchor: link.text,
        depth: item.depth + 1,
        focusTerms: config.focusTerms
      }).score

      if (linkScore < MIN_SCORE) continue
      queued.add(link.url)
      queue.push({
        url: link.url,
        depth: item.depth + 1,
        categoria: item.categoria,
        anchor: link.text
      })
    }
  }

  const byUrl = new Map()
  for (const page of pages) {
    const current = byUrl.get(page.url)
    if (!current || page.score > current.score) byUrl.set(page.url, page)
  }

  const selected = selectSources([...byUrl.values()])

  return {
    generated_at: new Date().toISOString(),
    max_depth: MAX_DEPTH,
    page_limit: MAX_PAGES,
    min_score: MIN_SCORE,
    selected_limit: MAX_CRAWL,
    seed_count: initialSeeds.length,
    visited_count: visited.size,
    discovered_count: byUrl.size,
    selected_count: selected.length,
    sources: selected.map(source => ({
      url: source.url,
      title: source.title,
      categoria: source.categoria,
      depth: source.depth,
      score: source.score,
      motivos: source.motivos,
      textLength: source.textLength
    })),
    selected
  }
}

async function writeDiscovery(result) {
  await mkdir(SOURCE_DIR, { recursive: true })

  const jsonPayload = {
    generated_at: result.generated_at,
    max_depth: result.max_depth,
    page_limit: result.page_limit,
    min_score: result.min_score,
    selected_limit: result.selected_limit,
    seed_count: result.seed_count,
    visited_count: result.visited_count,
    discovered_count: result.discovered_count,
    selected_count: result.selected_count,
    sources: result.sources
  }

  await writeFile(DISCOVERED_JSON, JSON.stringify(jsonPayload, null, 2) + '\n', 'utf-8')

  const rows = result.sources.map((source, index) => {
    const motivos = source.motivos?.length ? source.motivos.join(', ') : '-'
    return `| ${index + 1} | ${source.score} | ${source.categoria} | [${source.title}](${source.url}) | ${motivos} |`
  }).join('\n')

  const md = [
    '# Fontes oficiais UnB descobertas',
    '',
    `Gerado em: ${result.generated_at}`,
    '',
    '| # | Score | Categoria | Fonte | Sinais |',
    '|---:|---:|---|---|---|',
    rows,
    ''
  ].join('\n')

  await writeFile(DISCOVERED_MD, md, 'utf-8')
}

async function readOldManifest() {
  try {
    const raw = await readFile(CRAWL_MANIFEST, 'utf-8')
    const payload = JSON.parse(raw)
    return Array.isArray(payload.files) ? payload.files : []
  } catch {
    return []
  }
}

async function pruneOldCrawlFiles() {
  const oldFiles = await readOldManifest()
  for (const file of oldFiles) {
    if (!/^[a-z0-9.-]+\.md$/i.test(file)) continue
    await unlink(join(CRAWL_DIR, file)).catch(() => {})
  }
}

async function writeCrawlFiles(result) {
  await mkdir(CRAWL_DIR, { recursive: true })
  await pruneOldCrawlFiles()

  const files = []
  for (const source of result.selected) {
    const file = `${slugify(source.url)}.md`
    const title = source.title.replace(/\n/g, ' ').replace(/---/g, '').trim()
    const frontmatter = [
      '---',
      `title: ${title || source.url}`,
      `url: ${source.url}`,
      `contexto: ${source.categoria || 'unb-official'}`,
      'source: unb-official-discovery',
      `score: ${source.score}`,
      `discovered_at: ${result.generated_at}`,
      '---',
      ''
    ].join('\n')

    await writeFile(join(CRAWL_DIR, file), `${frontmatter}${source.text}\n`, 'utf-8')
    files.push(file)
  }

  const manifest = {
    generated_at: result.generated_at,
    count: files.length,
    files
  }
  await writeFile(CRAWL_MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf-8')
}

async function main() {
  const result = await discover()
  await writeDiscovery(result)

  if (WRITE_CRAWL) {
    await writeCrawlFiles(result)
  }

  console.log(
    `\nFontes UnB: ${result.visited_count} paginas visitadas, `
    + `${result.selected_count} selecionadas.`
  )
  console.log(`Inventario: ${DISCOVERED_JSON}`)
  if (WRITE_CRAWL) console.log(`Crawl RAG: ${CRAWL_DIR}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
