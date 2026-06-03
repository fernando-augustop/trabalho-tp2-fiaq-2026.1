import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

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

  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard',
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank'
      })
    }
  })
}
