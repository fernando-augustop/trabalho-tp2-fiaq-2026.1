const REFERENCE_SECTION_HEADINGS = new Set([
  'links',
  'links uteis',
  'fontes',
  'fontes uteis',
  'referencias'
])

function normalizeHeading(line: string): string {
  return line
    .replace(/[*_`>#]/g, '')
    .replace(/:$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function isReferenceOnlyLine(line: string): boolean {
  const normalized = line
    .replace(/[*_`]/g, '')
    .replace(/^[-*]\s+/, '')
    .trim()

  return /^(?:\[[0-9]+\]\s*)+$/.test(normalized)
}

export function stripInlineLinks(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\((?:[^)]*)\)/g, '$1')
    .replace(/<https?:\/\/[^>]+>/gi, '')
    .replace(/\bhttps?:\/\/\S+/gi, '')
    .replace(/\bwww\.\S+/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([.,;:!?])/g, '$1')
}

export function stripReferenceOnlySections(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')

  for (let index = 0; index < lines.length; index++) {
    const heading = normalizeHeading(lines[index] || '')
    if (!REFERENCE_SECTION_HEADINGS.has(heading)) continue

    const tail = lines.slice(index + 1).filter(line => line.trim())
    if (tail.length > 0 && tail.every(isReferenceOnlyLine)) {
      return lines.slice(0, index).join('\n').trimEnd()
    }
  }

  return text
}

export function cleanAssistantText(text: string): string {
  return stripReferenceOnlySections(stripInlineLinks(text))
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
