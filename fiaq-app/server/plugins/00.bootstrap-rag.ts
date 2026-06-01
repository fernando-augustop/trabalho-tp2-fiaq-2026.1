import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { embedChunk } from '../utils/embeddings'
import { addChunk, getStoreSize } from '../utils/vectorStore'
import { extractPdfChunks } from '../utils/pdfLoader'
import { extractCrawlChunks } from '../utils/crawlLoader'

export default defineNitroPlugin(async () => {
  console.log('[RAG] Starting indexing...')

  await indexFaq()
  await indexPdfs()
  await indexCrawl()

  console.log(`[RAG] Done. ${getStoreSize()} chunks indexed.`)
})

async function indexFaq() {
  const faqDir = join(process.cwd(), 'data', 'faq')

  let files: string[]
  try {
    files = await readdir(faqDir)
  } catch {
    console.warn('[RAG] No data/faq directory found, skipping FAQ indexing.')
    return
  }

  const jsonFiles = files.filter(f => f.endsWith('.json'))
  console.log(`[RAG] Found ${jsonFiles.length} FAQ file(s).`)

  for (const file of jsonFiles) {
    const raw = await readFile(join(faqDir, file), 'utf-8')
    const entries = JSON.parse(raw)

    for (const entry of entries) {
      try {
        const embedded = await embedChunk({ ...entry, kind: 'faq' })
        addChunk(embedded)
      } catch (e) {
        console.error(`[RAG] Failed to embed FAQ entry ${entry.id}:`, e)
      }
    }

    console.log(`[RAG] Indexed ${entries.length} entries from ${file}`)
  }
}

async function indexPdfs() {
  const pdfDir = join(process.cwd(), 'data', 'pdfs')

  let files: string[]
  try {
    files = await readdir(pdfDir)
  } catch {
    console.warn('[RAG] No data/pdfs directory found, skipping PDF indexing.')
    return
  }

  const pdfFiles = files.filter(f => f.endsWith('.pdf'))
  console.log(`[RAG] Found ${pdfFiles.length} PDF file(s).`)

  for (const file of pdfFiles) {
    const pdfPath = join(pdfDir, file)
    // e.g. "edital-pibic-2026.pdf" -> "Edital Pibic 2026"
    const label = file
      .replace('.pdf', '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())

    try {
      const chunks = await extractPdfChunks(pdfPath, label, '')
      for (const chunk of chunks) {
        const embedded = await embedChunk({ ...chunk, kind: 'pdf' })
        addChunk(embedded)
      }
      console.log(`[RAG] Indexed ${chunks.length} chunks from ${file}`)
    } catch (e) {
      console.error(`[RAG] Failed to index PDF ${file}:`, e)
    }
  }
}

async function indexCrawl() {
  const crawlDir = join(process.cwd(), 'data', 'crawl')

  let files: string[]
  try {
    files = await readdir(crawlDir)
  } catch {
    console.warn('[RAG] No data/crawl directory found, skipping crawl indexing.')
    return
  }

  const mdFiles = files.filter(f => f.endsWith('.md'))
  console.log(`[RAG] Found ${mdFiles.length} crawled page(s).`)

  let total = 0
  for (const file of mdFiles) {
    const slug = file.replace(/\.md$/, '')
    try {
      const chunks = await extractCrawlChunks(join(crawlDir, file), slug)
      for (const chunk of chunks) {
        const embedded = await embedChunk({ ...chunk, kind: 'crawl' })
        addChunk(embedded)
      }
      total += chunks.length
    } catch (e) {
      console.error(`[RAG] Failed to index crawl ${file}:`, e)
    }
  }
  console.log(`[RAG] Indexed ${total} chunks from ${mdFiles.length} crawled pages.`)
}
