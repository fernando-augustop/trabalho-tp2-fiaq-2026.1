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

type SourceInput = Partial<Source>

const BRAND_NAVY = '#1a2e5a'
const BRAND_GREEN = '#00DC82'
const TEXT_SLATE = '#24324a'
const MUTED_SLATE = '#64748b'
const BORDER_SLATE = '#e2e8f0'
const SURFACE_SLATE = '#f8fafc'

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

function pdfSafeText(text: string): string {
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, '\'')
    .replace(/[–—]/g, '-')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/⁂/g, '')
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code === 9 || code === 10 || code === 13 || code >= 32
    })
    .join('')
}

function sourceKey(source: Source): string {
  return source.url || `${source.id}:${source.titulo}`
}

function hasSourceIdentity(source: unknown): source is SourceInput {
  if (!source || typeof source !== 'object') return false
  const candidate = source as SourceInput
  return Boolean(String(candidate.titulo || '').trim() || String(candidate.url || '').trim())
}

function cleanSource(source: SourceInput): Source {
  return {
    id: String(source.id || source.url || source.titulo || 'fonte'),
    titulo: decodeEntities(String(source.titulo || 'Fonte oficial')).replace(/\s+/g, ' ').trim() || 'Fonte oficial',
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
  const paragraphs = pdfSafeText(plainText(text)).split('\n')
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

function sourceHost(source: Source): string {
  try {
    return new URL(source.url).hostname.replace(/^www\./, '')
  } catch {
    return 'fonte oficial'
  }
}

function drawPdfPill(
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  label: string,
  x: number,
  y: number,
  tone: 'navy' | 'green' | 'slate' = 'slate'
) {
  const width = doc.getTextWidth(label) + 15
  const fill = tone === 'navy' ? BRAND_NAVY : tone === 'green' ? '#dcfce7' : '#f1f5f9'
  const text = tone === 'navy' ? '#ffffff' : tone === 'green' ? '#047857' : MUTED_SLATE

  doc.setFillColor(fill)
  doc.roundedRect(x, y - 11, width, 18, 9, 9, 'F')
  doc.setTextColor(text)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(label, x + 7.5, y + 1)

  return width
}

function drawPdfRefLinks(
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  refs: number[],
  x: number,
  y: number,
  maxWidth: number,
  refLinks: PdfRefLink[]
): number {
  let cursorX = x
  let cursorY = y

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(MUTED_SLATE)
  doc.text('Fontes', cursorX, cursorY)
  cursorX += doc.getTextWidth('Fontes') + 8

  for (const ref of refs) {
    const label = `[${ref}]`
    const width = doc.getTextWidth(label) + 16
    if (cursorX + width > x + maxWidth) {
      cursorX = x
      cursorY += 22
    }

    doc.setFillColor('#e0f2fe')
    doc.roundedRect(cursorX, cursorY - 12, width, 18, 9, 9, 'F')
    doc.setTextColor(BRAND_NAVY)
    doc.text(label, cursorX + 8, cursorY)
    refLinks.push({
      page: doc.getCurrentPageInfo().pageNumber,
      x: cursorX,
      y: cursorY - 12,
      width,
      height: 18,
      sourceIndex: ref
    })
    cursorX += width + 6
  }

  return cursorY + 22
}

function drawPdfShell(doc: InstanceType<typeof import('jspdf').jsPDF>, title: string) {
  const pages = doc.getNumberOfPages()
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()

  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setFillColor('#ffffff')
    doc.rect(0, 0, width, 78, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(BRAND_NAVY)
    doc.text('f', 42, 49)
    doc.setTextColor(BRAND_GREEN)
    doc.text('IA', 52, 49)
    doc.setTextColor(BRAND_NAVY)
    doc.text('q', 77, 49)

    doc.setTextColor(BRAND_NAVY)
    doc.setFontSize(9)
    doc.text('Assistente Virtual UnB', width - 144, 42)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(MUTED_SLATE)
    doc.text('Conversa exportada', width - 144, 55)

    doc.setDrawColor(BORDER_SLATE)
    doc.line(42, 72, width - 42, 72)

    doc.setFontSize(8)
    doc.setTextColor(MUTED_SLATE)
    doc.text(pdfSafeText(title), 42, height - 34, { maxWidth: width - 140 })
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

  doc.setProperties({
    title,
    subject: 'Conversa exportada pelo fIAq',
    author: 'fIAq'
  })

  doc.setFillColor(SURFACE_SLATE)
  doc.roundedRect(marginX, y - 18, contentWidth, 92, 16, 16, 'F')
  drawPdfPill(doc, 'Conversa fIAq', marginX + 18, y + 2, 'green')
  doc.setTextColor(BRAND_NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  y = addWrappedText(doc, title, marginX + 18, y + 30, contentWidth - 36, 20) + 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED_SLATE)
  doc.text(`Exportado em ${new Date().toLocaleString('pt-BR')}`, marginX + 18, y)
  y += 42

  for (const message of messages) {
    y = ensurePdfSpace(doc, y, 72)

    if (message.role === 'user') {
      question++
      doc.setDrawColor(BRAND_GREEN)
      doc.setLineWidth(2)
      doc.line(marginX, y - 2, marginX, y + 42)
      doc.setFont('helvetica', 'bold')
      drawPdfPill(doc, `Pergunta ${question}`, marginX + 12, y, 'navy')
      y += 22

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(TEXT_SLATE)
      y = addWrappedText(doc, message.content, marginX + 12, y, contentWidth - 12, 15) + 18
      continue
    }

    answer++
    doc.setDrawColor(BORDER_SLATE)
    doc.setLineWidth(1)
    doc.line(marginX, y - 2, marginX, y + 42)
    doc.setFont('helvetica', 'bold')
    drawPdfPill(doc, `Resposta ${answer}`, marginX + 12, y, 'slate')
    y += 22

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(TEXT_SLATE)
    y = addWrappedText(doc, message.content, marginX + 12, y, contentWidth - 12, 15)

    const refs = registry.byMessageId.get(message.id) ?? []
    if (refs.length) {
      y = ensurePdfSpace(doc, y, 24)
      y = drawPdfRefLinks(doc, refs, marginX + 12, y, contentWidth - 12, refLinks)
    }

    y += 12
  }

  if (registry.records.length) {
    doc.addPage()
    y = 104
    doc.setFillColor(SURFACE_SLATE)
    doc.roundedRect(marginX, y - 18, contentWidth, 70, 16, 16, 'F')
    drawPdfPill(doc, 'Referências', marginX + 18, y + 2, 'green')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(BRAND_NAVY)
    doc.text('Fontes oficiais', marginX + 18, y + 32)
    y += 78

    for (const record of registry.records) {
      const sourceTitle = pdfSafeText(record.source.titulo)
      const sourceUrl = pdfSafeText(record.source.url)
      const titleLines = doc.splitTextToSize(sourceTitle, contentWidth - 92) as string[]
      const urlLines = sourceUrl ? doc.splitTextToSize(sourceUrl, contentWidth - 92) as string[] : []
      const visibleUrlLines = urlLines.slice(0, 2)
      const cardHeight = Math.max(78, 42 + titleLines.length * 12 + visibleUrlLines.length * 10)
      y = ensurePdfSpace(doc, y, cardHeight + 18)
      sourceTargets.set(record.index, { page: doc.getCurrentPageInfo().pageNumber })

      doc.setFillColor('#ffffff')
      doc.setDrawColor(BORDER_SLATE)
      doc.roundedRect(marginX, y, contentWidth, cardHeight, 14, 14, 'FD')

      doc.setFillColor(BRAND_NAVY)
      doc.roundedRect(marginX + 16, y + 18, 36, 30, 8, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor('#ffffff')
      doc.text(`[${record.index}]`, marginX + 25, y + 37)

      doc.setFontSize(8)
      doc.setTextColor(MUTED_SLATE)
      doc.text('fonte oficial', marginX + 66, y + 22)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(BRAND_NAVY)
      doc.text(titleLines, marginX + 66, y + 38)

      if (record.source.url) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(37, 99, 235)
        doc.text(pdfSafeText(sourceHost(record.source)), marginX + 66, y + cardHeight - 26)
        doc.setTextColor(MUTED_SLATE)
        let urlY = y + cardHeight - 13
        for (const line of visibleUrlLines) {
          doc.text(line, marginX + 66, urlY)
          doc.link(marginX + 66, urlY - 9, Math.min(doc.getTextWidth(line), contentWidth - 92), 11, { url: record.source.url })
          urlY += 10
        }
        doc.link(marginX, y, contentWidth, cardHeight, { url: record.source.url })
      }
      y += cardHeight + 12
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
        ? (message.sources as unknown[])
            .filter(hasSourceIdentity)
            .map(cleanSource)
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
