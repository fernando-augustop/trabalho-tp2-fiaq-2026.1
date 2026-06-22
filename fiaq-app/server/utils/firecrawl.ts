export interface FirecrawlSource {
  id: string
  titulo: string
  url: string
  description?: string
  markdown?: string
  kind: 'web'
}

interface FirecrawlWebResult {
  title?: string
  description?: string
  url?: string
  markdown?: string | null
  metadata?: {
    title?: string
    description?: string
    sourceURL?: string
    url?: string
  }
}

interface FirecrawlSearchResponse {
  success?: boolean
  data?: {
    web?: FirecrawlWebResult[]
  }
  web?: FirecrawlWebResult[]
  error?: string
}

interface SearchFirecrawlOptions {
  signal?: AbortSignal
}

const FIRECRAWL_DEFAULT_API_URL = 'https://api.firecrawl.dev'
const FIRECRAWL_SEARCH_LIMIT = readPositiveInt(process.env.FIRECRAWL_SEARCH_LIMIT, 4)
const FIRECRAWL_TIMEOUT_MS = readPositiveInt(process.env.FIRECRAWL_TIMEOUT_MS, 25000)
const FIRECRAWL_MAX_AGE_MS = readPositiveInt(process.env.FIRECRAWL_MAX_AGE_MS, 604800000)
const FIRECRAWL_RESULT_CHARS = readPositiveInt(process.env.FIRECRAWL_RESULT_CHARS, 1200)
const FIRECRAWL_TOTAL_CHARS = readPositiveInt(process.env.FIRECRAWL_TOTAL_CHARS, 4800)
const DEFAULT_INCLUDE_DOMAINS = [
  'cic.unb.br',
  'www.cic.unb.br',
  'unb.br',
  'www.unb.br',
  'saa.unb.br',
  'sigaa.unb.br'
]

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

function parseDomains(value: string | undefined): string[] {
  const domains = value
    ?.split(',')
    .map(domain => domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, ''))
    .filter(Boolean)

  return domains?.length ? [...new Set(domains)] : DEFAULT_INCLUDE_DOMAINS
}

function firecrawlBaseUrl(): string {
  return (process.env.FIRECRAWL_API_URL || FIRECRAWL_DEFAULT_API_URL).replace(/\/$/, '')
}

function firecrawlHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim()
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  return headers
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\(([^)]*)\)/g, '$1')
    .replace(/<Base64-Image-Removed>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function compactText(text: string | undefined | null, maxChars: number): string {
  const normalized = normalizeWhitespace(String(text || ''))
  if (normalized.length <= maxChars) return normalized

  return `${normalized.slice(0, maxChars).replace(/\s+\S*$/, '').trim()}...`
}

function sourceId(url: string, index: number): string {
  try {
    return `web:${new URL(url).hostname}:${index + 1}`
  } catch {
    return `web:${index + 1}`
  }
}

export async function searchFirecrawl(question: string, options: SearchFirecrawlOptions = {}): Promise<FirecrawlSource[]> {
  const trimmed = question.trim().slice(0, 500)
  if (!trimmed) return []

  const abort = new AbortController()
  const abortFromCaller = () => abort.abort(options.signal?.reason)
  const timeout = setTimeout(() => abort.abort(), FIRECRAWL_TIMEOUT_MS)

  if (options.signal?.aborted) {
    abortFromCaller()
  } else {
    options.signal?.addEventListener('abort', abortFromCaller, { once: true })
  }

  try {
    const res = await fetch(`${firecrawlBaseUrl()}/v2/search`, {
      method: 'POST',
      headers: firecrawlHeaders(),
      signal: abort.signal,
      body: JSON.stringify({
        query: trimmed,
        limit: FIRECRAWL_SEARCH_LIMIT,
        sources: [{ type: 'web' }],
        includeDomains: parseDomains(process.env.FIRECRAWL_INCLUDE_DOMAINS),
        ignoreInvalidURLs: true,
        scrapeOptions: {
          formats: [{ type: 'markdown' }],
          onlyMainContent: true,
          maxAge: FIRECRAWL_MAX_AGE_MS
        }
      })
    })

    const responseText = await res.text()
    let payload: FirecrawlSearchResponse

    try {
      payload = responseText ? JSON.parse(responseText) as FirecrawlSearchResponse : {}
    } catch {
      payload = { error: responseText }
    }

    if (!res.ok || payload.success === false) {
      throw new Error(`Firecrawl search error: ${res.status} ${payload.error || ''}`.trim())
    }

    const web = payload.data?.web ?? payload.web ?? []
    return web
      .map((result, index): FirecrawlSource | null => {
        const url = String(result.url || result.metadata?.sourceURL || result.metadata?.url || '').trim()
        if (!/^https?:\/\//i.test(url)) return null

        const titulo = normalizeWhitespace(String(result.title || result.metadata?.title || url)) || 'Fonte web'
        const description = compactText(result.description || result.metadata?.description, 260)
        const markdown = compactText(result.markdown, FIRECRAWL_RESULT_CHARS)

        return {
          id: sourceId(url, index),
          titulo,
          url,
          description: description || undefined,
          markdown: markdown || undefined,
          kind: 'web'
        }
      })
      .filter((source): source is FirecrawlSource => Boolean(source))
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener('abort', abortFromCaller)
  }
}

export function buildFirecrawlContext(sources: FirecrawlSource[]): string {
  if (!sources.length) return 'Nenhuma fonte web oficial foi encontrada.'

  const parts: string[] = []
  let usedChars = 0

  for (const [index, source] of sources.entries()) {
    const body = source.markdown || source.description || ''
    const remaining = FIRECRAWL_TOTAL_CHARS - usedChars
    if (remaining < 240) break

    const snippet = compactText(body, Math.min(FIRECRAWL_RESULT_CHARS, remaining))
    const part = [
      `[${index + 1}] ${source.titulo}`,
      `URL: ${source.url}`,
      source.description ? `Resumo: ${source.description}` : '',
      snippet ? `Conteúdo: ${snippet}` : ''
    ].filter(Boolean).join('\n')

    parts.push(part)
    usedChars += part.length + 2
  }

  return parts.join('\n\n')
}
