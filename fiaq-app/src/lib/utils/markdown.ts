import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ breaks: true, gfm: true })

const allowedTags = [
  'a',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'h3',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'ul'
]

export function renderMarkdown(text: string): string {
  const html = marked.parse(text ?? '', { async: false }) as string
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['href', 'title', 'rel', 'target']
  })

  if (typeof document === 'undefined') return sanitized

  const template = document.createElement('template')
  template.innerHTML = sanitized
  template.content.querySelectorAll('a').forEach((link) => {
    link.setAttribute('rel', 'noopener noreferrer')
    link.setAttribute('target', '_blank')
  })

  return template.innerHTML
}
