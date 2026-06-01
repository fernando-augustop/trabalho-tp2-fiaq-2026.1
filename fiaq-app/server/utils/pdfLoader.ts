import { extractText } from 'unpdf'
import { readFile } from 'fs/promises'

export interface PdfChunk {
  id: string
  titulo: string
  conteudo: string
  url: string
}

export function splitIntoChunks(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: string[] = []

  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim()) chunks.push(chunk)
    i += chunkSize - overlap
  }

  return chunks
}

export async function extractPdfChunks(
  pdfPath: string,
  sourceLabel: string,
  sourceUrl: string
): Promise<PdfChunk[]> {
  const buffer = await readFile(pdfPath)
  const { text } = await extractText(new Uint8Array(buffer), { mergePages: true })

  const rawText = (Array.isArray(text) ? text.join(' ') : text)
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()

  const chunks = splitIntoChunks(rawText)

  return chunks.map((conteudo, index) => ({
    id: `pdf-${sourceLabel.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`,
    titulo: `${sourceLabel} (parte ${index + 1})`,
    conteudo,
    url: sourceUrl
  }))
}
