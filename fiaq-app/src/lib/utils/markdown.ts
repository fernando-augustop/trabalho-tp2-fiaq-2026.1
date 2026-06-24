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

const allowedTagSet = new Set(allowedTags)

function sanitizeServerHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*(["'])?\s*javascript:[^"'\s>]*/gi, '')
    .replace(/<\/?([a-z][a-z0-9-]*)(\s[^>]*)?>/gi, (match, tagName: string, attrs = '') => {
      const tag = tagName.toLowerCase()
      if (!allowedTagSet.has(tag)) return ''
      if (match.startsWith('</')) return `</${tag}>`
      if (tag !== 'a') return `<${tag}>`

      const href = String(attrs).match(/\shref\s*=\s*(["'])(.*?)\1/i)?.[2] ?? ''
      const title = String(attrs).match(/\stitle\s*=\s*(["'])(.*?)\1/i)?.[2] ?? ''
      const safeHref = /^https?:\/\//i.test(href) || href.startsWith('mailto:') ? href : ''
      const safeAttrs = [
        safeHref ? `href="${safeHref.replace(/"/g, '&quot;')}"` : '',
        title ? `title="${title.replace(/"/g, '&quot;')}"` : '',
        'rel="noopener noreferrer"',
        'target="_blank"'
      ].filter(Boolean).join(' ')

      return `<a ${safeAttrs}>`
    })
}

export function renderMarkdown(text: string): string {
  const html = marked.parse(text ?? '', { async: false }) as string

  if (typeof document === 'undefined') {
    return sanitizeServerHtml(html)
  }

  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['href', 'title', 'rel', 'target']
  })

  const template = document.createElement('template')
  template.innerHTML = sanitized
  template.content.querySelectorAll('a').forEach((link) => {
    link.setAttribute('rel', 'noopener noreferrer')
    link.setAttribute('target', '_blank')
  })

  return template.innerHTML
}
