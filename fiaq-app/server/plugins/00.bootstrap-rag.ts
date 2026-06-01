import { readFile, readdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { embedChunk } from '../utils/embeddings'
import type { EmbeddedChunk } from '../utils/embeddings'
import { addChunk, loadChunks, getAllChunks, getStoreSize } from '../utils/vectorStore'
import { embedInfo } from '../utils/ollama'
import { extractPdfChunks } from '../utils/pdfLoader'
import { extractCrawlChunks } from '../utils/crawlLoader'

interface RagIndexFile {
  meta: { provider?: string, model?: string, dim?: number, count?: number, builtAt?: string }
  chunks: EmbeddedChunk[]
}

// Caminho do índice em disco — usado apenas para REGRAVAR o cache em dev/regeneração.
const INDEX_PATH = join(process.cwd(), 'server', 'assets', 'rag-index.json')

// O índice é carregado como SERVER ASSET (não via import estático), pois importar
// um JSON de vários MB faz o bundler inaliná-lo num chunk JS e estourar o heap.
// server/assets/ é empacotado pelo Nitro e exposto no storage "assets:server".
async function loadCachedIndex(): Promise<RagIndexFile | null> {
  try {
    const data = await useStorage('assets:server').getItem('rag-index.json')
    if (!data) return null
    return (typeof data === 'string' ? JSON.parse(data) : data) as RagIndexFile
  } catch {
    return null
  }
}

export default defineNitroPlugin(async () => {
  const force = process.env.RAG_FORCE_REINDEX === '1'
  const cached = force ? null : await loadCachedIndex()

  // Caminho rápido (produção/Vercel e dev normal): hidrata do índice pré-computado.
  if (cached?.chunks?.length) {
    loadChunks(cached.chunks)
    if (cached.meta?.model && cached.meta.model !== embedInfo.model) {
      console.warn(
        `[RAG] ⚠️ Índice foi gerado com "${cached.meta.model}" mas o runtime usa `
        + `"${embedInfo.model}". As buscas podem ficar inconsistentes — regenere o índice.`
      )
    }
    console.log(`[RAG] Índice pré-computado carregado: ${getStoreSize()} chunks (modelo: ${cached.meta?.model ?? '?'}).`)
    return
  }

  // Caminho de regeneração: indexa ao vivo (chama o provider de embeddings) e
  // grava o índice em disco para ser commitado e empacotado no deploy.
  console.log('[RAG] Regenerando índice (indexação ao vivo)...')
  await indexFaq()
  await indexPdfs()
  await indexCrawl()
  console.log(`[RAG] Indexação concluída: ${getStoreSize()} chunks.`)
  await writeIndex()
})

async function writeIndex(): Promise<void> {
  const chunks = getAllChunks()
  const payload: RagIndexFile = {
    meta: {
      provider: embedInfo.provider,
      model: embedInfo.model,
      dim: chunks[0]?.vector.length ?? 0,
      count: chunks.length,
      builtAt: new Date().toISOString()
    },
    chunks
  }
  try {
    await writeFile(INDEX_PATH, JSON.stringify(payload) + '\n', 'utf-8')
    console.log(`[RAG] Índice gravado em ${INDEX_PATH} (${chunks.length} chunks, dim ${payload.meta.dim}).`)
  } catch (e) {
    console.warn('[RAG] Não foi possível gravar o índice (FS somente-leitura?):', e)
  }
}

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
