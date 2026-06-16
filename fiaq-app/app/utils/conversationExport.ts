import type { Message, MessageDraft, Source } from '~/composables/useFiaqChat'

export type ConversationExportFormat = 'json' | 'txt' | 'md' | 'pdf'

interface PortableConversation {
  app: 'fiaq'
  kind: 'temporary-conversation'
  version: 1
  exportedAt: string
  title: string
  messages: Array<{
    role: Message['role']
    content: string
    sources?: Source[]
  }>
}

interface SourceRecord {
  index: number
  source: Source
}

interface SourceRegistry {
  records: SourceRecord[]
  byMessageId: Map<number, number[]>
}

interface PdfRefLink {
  page: number
  x: number
  y: number
  width: number
  height: number
  sourceIndex: number
}

interface PdfSourceTarget {
  page: number
}

const BRAND_NAVY = '#1a2e5a'
const BRAND_GREEN = '#00DC82'
const TEXT_SLATE = '#24324a'
const MUTED_SLATE = '#64748b'

function exportableMessages(messages: Message[]): Message[] {
  return messages
    .filter(message => message.content?.trim())
    .map(message => ({
      id: message.id,
      role: message.role,
      content: message.content.trim(),
      sources: message.sources?.filter(source => source.titulo || source.url),
      streaming: false
    }))
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function plainText(text: string): string {
  return decodeEntities(text)
    .replace(/\[([^\]]+)\]\((?:[^)]*)\)/g, '$1')
    .replace(/[*_~`>#]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function sourceKey(source: Source): string {
  return source.url || `${source.id}:${source.titulo}`
}

function cleanSource(source: Source): Source {
  return {
    id: String(source.id || source.url || source.titulo || 'fonte'),
    titulo: decodeEntities(source.titulo || 'Fonte oficial').replace(/\s+/g, ' ').trim() || 'Fonte oficial',
    url: String(source.url || '').trim()
  }
}

function createSourceRegistry(messages: Message[]): SourceRegistry {
  const byKey = new Map<string, SourceRecord>()
  const byMessageId = new Map<number, number[]>()

  for (const message of messages) {
    if (message.role !== 'assistant' || !message.sources?.length) continue

    const refs: number[] = []
    for (const rawSource of message.sources) {
      const source = cleanSource(rawSource)
      const key = sourceKey(source)
      let record = byKey.get(key)

      if (!record) {
        record = { index: byKey.size + 1, source }
        byKey.set(key, record)
      }

      refs.push(record.index)
    }

    if (refs.length) byMessageId.set(message.id, [...new Set(refs)])
  }

  return {
    records: [...byKey.values()].sort((a, b) => a.index - b.index),
    byMessageId
  }
}

function conversationTitle(messages: Message[]): string {
  const firstQuestion = messages.find(message => message.role === 'user')?.content
  if (!firstQuestion) return 'Conversa fIAq'

  const normalized = plainText(firstQuestion).replace(/\s+/g, ' ')
  return normalized.length > 72 ? `${normalized.slice(0, 69)}...` : normalized
}

function fileStamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')
}

function safeFilename(title: string, extension: string): string {
  const normalized = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const slug = normalized.slice(0, 52).replace(/^-+|-+$/g, '') || 'conversa-fiaq'

  return `${slug}-${fileStamp()}.${extension}`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function toPortableConversation(messages: Message[]): PortableConversation {
  const cleanMessages = exportableMessages(messages)

  return {
    app: 'fiaq',
    kind: 'temporary-conversation',
    version: 1,
    exportedAt: new Date().toISOString(),
    title: conversationTitle(cleanMessages),
    messages: cleanMessages.map(message => ({
      role: message.role,
      content: message.content,
      sources: message.sources?.map(cleanSource)
    }))
  }
}

function buildTxt(messages: Message[]): string {
  const registry = createSourceRegistry(messages)
  const lines = [
    'fIAq - Conversa exportada',
    `Exportado em ${new Date().toLocaleString('pt-BR')}`,
    ''
  ]

  let question = 0
  let answer = 0

  for (const message of messages) {
    if (message.role === 'user') {
      question++
      lines.push(`Pergunta ${question}`, plainText(message.content), '')
      continue
    }

    answer++
    const refs = registry.byMessageId.get(message.id) ?? []
    const suffix = refs.length ? `\n\nFontes: ${refs.map(ref => `[${ref}]`).join(' ')}` : ''
    lines.push(`Resposta ${answer}`, `${plainText(message.content)}${suffix}`, '')
  }

  if (registry.records.length) {
    lines.push('Fontes oficiais')
    for (const record of registry.records) {
      lines.push(`[${record.index}] ${record.source.titulo}${record.source.url ? ` - ${record.source.url}` : ''}`)
    }
  }

  return `${lines.join('\n')}\n`
}

function buildMarkdown(messages: Message[]): string {
  const registry = createSourceRegistry(messages)
  const lines = [
    '# fIAq - Conversa exportada',
    '',
    `Exportado em ${new Date().toLocaleString('pt-BR')}`,
    ''
  ]

  let question = 0
  let answer = 0

  for (const message of messages) {
    if (message.role === 'user') {
      question++
      lines.push(`## Pergunta ${question}`, '', message.content.trim(), '')
      continue
    }

    answer++
    const refs = registry.byMessageId.get(message.id) ?? []
    const suffix = refs.length ? `\n\nFontes: ${refs.map(ref => `[${ref}][fonte-${ref}]`).join(' ')}` : ''
    lines.push(`## Resposta ${answer}`, '', `${message.content.trim()}${suffix}`, '')
  }

  if (registry.records.length) {
    lines.push('## Fontes oficiais', '')
    for (const record of registry.records) {
      const source = record.source
      lines.push(`[${record.index}] ${source.url ? `[${source.titulo}](${source.url})` : source.titulo}`)
    }
    lines.push('')
    for (const record of registry.records) {
      if (record.source.url) lines.push(`[fonte-${record.index}]: ${record.source.url} "${record.source.titulo.replace(/"/g, '\'')}"`)
    }
  }

  return `${lines.join('\n')}\n`
}

function addWrappedText(
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const paragraphs = plainText(text).split('\n')
  let cursorY = y

  for (const paragraph of paragraphs) {
    const lines = doc.splitTextToSize(paragraph || ' ', maxWidth) as string[]
    for (const line of lines) {
      cursorY = ensurePdfSpace(doc, cursorY, lineHeight)
      doc.text(line, x, cursorY)
      cursorY += lineHeight
    }
    cursorY += lineHeight * 0.35
  }

  return cursorY
}

function ensurePdfSpace(
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  y: number,
  needed = 28
): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + needed <= pageHeight - 72) return y

  doc.addPage()
  return 92
}

function drawPdfShell(doc: InstanceType<typeof import('jspdf').jsPDF>, title: string) {
  const pages = doc.getNumberOfPages()
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()

  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setFillColor(BRAND_NAVY)
    doc.roundedRect(42, 30, 30, 30, 6, 6, 'F')
    doc.setTextColor(BRAND_GREEN)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('f', 53, 49)

    doc.setTextColor(BRAND_NAVY)
    doc.setFontSize(17)
    doc.text('fIAq', 82, 43)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(MUTED_SLATE)
    doc.text('Assistente Virtual UnB', 82, 57)

    doc.setDrawColor(226, 232, 240)
    doc.line(42, 72, width - 42, 72)

    doc.setFontSize(8)
    doc.setTextColor(MUTED_SLATE)
    doc.text(title, 42, height - 34, { maxWidth: width - 140 })
    doc.text(`${page}/${pages}`, width - 64, height - 34)
  }
}

async function exportPdf(messages: Message[], filename: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const registry = createSourceRegistry(messages)
  const refLinks: PdfRefLink[] = []
  const sourceTargets = new Map<number, PdfSourceTarget>()
  const width = doc.internal.pageSize.getWidth()
  const marginX = 54
  const contentWidth = width - marginX * 2
  let y = 104
  let question = 0
  let answer = 0
  const title = conversationTitle(messages)

  doc.setTextColor(BRAND_NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  y = addWrappedText(doc, title, marginX, y, contentWidth, 22) + 14

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED_SLATE)
  doc.text(`Exportado em ${new Date().toLocaleString('pt-BR')}`, marginX, y)
  y += 28

  for (const message of messages) {
    y = ensurePdfSpace(doc, y, 72)

    if (message.role === 'user') {
      question++
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(BRAND_NAVY)
      doc.text(`Pergunta ${question}`, marginX, y)
      y += 18

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(TEXT_SLATE)
      y = addWrappedText(doc, message.content, marginX, y, contentWidth, 15) + 14
      continue
    }

    answer++
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(BRAND_NAVY)
    doc.text(`Resposta ${answer}`, marginX, y)
    y += 18

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(TEXT_SLATE)
    y = addWrappedText(doc, message.content, marginX, y, contentWidth, 15)

    const refs = registry.byMessageId.get(message.id) ?? []
    if (refs.length) {
      y = ensurePdfSpace(doc, y, 24)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(MUTED_SLATE)
      doc.text('Fontes:', marginX, y)
      let x = marginX + doc.getTextWidth('Fontes:') + 8

      for (const ref of refs) {
        const label = `[${ref}]`
        const labelWidth = doc.getTextWidth(label)
        doc.setTextColor(BRAND_NAVY)
        doc.text(label, x, y)
        refLinks.push({
          page: doc.getCurrentPageInfo().pageNumber,
          x,
          y: y - 10,
          width: labelWidth,
          height: 13,
          sourceIndex: ref
        })
        x += labelWidth + 7
      }
      y += 24
    }

    y += 8
  }

  if (registry.records.length) {
    doc.addPage()
    y = 104
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(BRAND_NAVY)
    doc.text('Fontes oficiais', marginX, y)
    y += 30

    for (const record of registry.records) {
      y = ensurePdfSpace(doc, y, 58)
      sourceTargets.set(record.index, { page: doc.getCurrentPageInfo().pageNumber })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(BRAND_NAVY)
      doc.text(`[${record.index}] ${record.source.titulo}`, marginX, y, { maxWidth: contentWidth })
      y += 16

      if (record.source.url) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(37, 99, 235)
        const urlLines = doc.splitTextToSize(record.source.url, contentWidth) as string[]
        for (const line of urlLines) {
          doc.text(line, marginX, y)
          doc.link(marginX, y - 9, Math.min(doc.getTextWidth(line), contentWidth), 11, { url: record.source.url })
          y += 12
        }
      }
      y += 12
    }
  }

  for (const link of refLinks) {
    const target = sourceTargets.get(link.sourceIndex)
    if (!target) continue
    doc.setPage(link.page)
    doc.link(link.x, link.y, link.width, link.height, { pageNumber: target.page })
  }

  drawPdfShell(doc, title)
  downloadBlob(doc.output('blob'), filename)
}

export async function exportConversation(messages: Message[], format: ConversationExportFormat) {
  const cleanMessages = exportableMessages(messages)
  if (!cleanMessages.length) throw new Error('EMPTY_CONVERSATION')

  const title = conversationTitle(cleanMessages)

  if (format === 'json') {
    const content = JSON.stringify(toPortableConversation(cleanMessages), null, 2)
    downloadBlob(new Blob([`${content}\n`], { type: 'application/json;charset=utf-8' }), safeFilename(title, 'json'))
    return
  }

  if (format === 'txt') {
    downloadBlob(new Blob([buildTxt(cleanMessages)], { type: 'text/plain;charset=utf-8' }), safeFilename(title, 'txt'))
    return
  }

  if (format === 'md') {
    downloadBlob(new Blob([buildMarkdown(cleanMessages)], { type: 'text/markdown;charset=utf-8' }), safeFilename(title, 'md'))
    return
  }

  await exportPdf(cleanMessages, safeFilename(title, 'pdf'))
}

export async function readConversationFile(file: File): Promise<MessageDraft[]> {
  const text = await file.text()
  const payload = JSON.parse(text)
  const rawMessages = Array.isArray(payload) ? payload : payload?.messages
  if (!Array.isArray(rawMessages)) throw new Error('INVALID_CONVERSATION')

  const messages = rawMessages
    .map((message): MessageDraft | null => {
      const role = message?.role === 'assistant' ? 'assistant' : message?.role === 'user' ? 'user' : null
      const content = typeof message?.content === 'string' ? message.content.trim() : ''
      if (!role || !content) return null

      const sources = Array.isArray(message.sources)
        ? (message.sources as Source[]).map(cleanSource).filter((source: Source) => source.titulo || source.url)
        : undefined

      return {
        role,
        content,
        streaming: false,
        sources: sources?.length ? sources : undefined
      }
    })
    .filter((message): message is MessageDraft => Boolean(message))

  if (!messages.length) throw new Error('EMPTY_CONVERSATION')
  return messages
}
