import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

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

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (String(node.nodeName).toLowerCase() === 'a') {
    node.setAttribute('rel', 'noopener noreferrer')
    node.setAttribute('target', '_blank')
  }
})

export function renderMarkdown(text: string): string {
  const html = marked.parse(text ?? '', { async: false }) as string

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['href', 'title', 'rel', 'target']
  })
}
