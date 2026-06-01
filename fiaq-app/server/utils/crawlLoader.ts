import { readFile } from 'fs/promises'
import { splitIntoChunks } from './pdfLoader'

export interface CrawlChunk {
  id: string
  titulo: string
  conteudo: string
  url: string
}

interface CrawlDoc {
  title: string
  url: string
  body: string
}

// Lê um arquivo de página crawleada (data/crawl/<slug>.md) com frontmatter
// simples (title / url / contexto) seguido do texto extraído.
function parseCrawlFile(raw: string): CrawlDoc {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { title: '', url: '', body: raw }

  const meta = m[1]
  const body = m[2].trim()
  const get = (key: string): string => {
    const line = meta.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))
    return line ? line[1].trim() : ''
  }
  return { title: get('title'), url: get('url'), body }
}

export async function extractCrawlChunks(filePath: string, slug: string): Promise<CrawlChunk[]> {
  const raw = await readFile(filePath, 'utf-8')
  const { title, url, body } = parseCrawlFile(raw)

  const cleanBody = body.replace(/\s+/g, ' ').trim()
  const chunks = splitIntoChunks(cleanBody)
  const label = title || slug

  return chunks.map((conteudo, index) => ({
    id: `crawl-${slug}-${index + 1}`,
    titulo: chunks.length > 1 ? `${label} (parte ${index + 1})` : label,
    conteudo,
    url,
  }))
}
