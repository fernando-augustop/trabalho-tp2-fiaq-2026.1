import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

interface FaqItem {
  id: string
  titulo: string
  conteudo: string
  url: string
}

export interface FaqCategory {
  slug: string
  titulo: string
  count: number
  items: FaqItem[]
}

// Títulos legíveis por categoria (o slug vem do nome do arquivo faq-<slug>.json).
const TITULOS: Record<string, string> = {
  'matricula': 'Matrícula',
  'estrutura-curricular': 'Estrutura Curricular',
  'atividades-de-curso': 'Atividades de Curso',
  'trajetoria-academica': 'Trajetória Acadêmica',
  'organizacoes-estudantis': 'Organizações Estudantis',
  'coordenacao': 'Coordenação',
  'leia-me': 'Informações Gerais'
}

// Ordem de exibição na home (categorias fora desta lista vão para o fim).
const ORDEM = [
  'matricula',
  'estrutura-curricular',
  'atividades-de-curso',
  'trajetoria-academica',
  'organizacoes-estudantis',
  'coordenacao',
  'leia-me'
]

function prettyTitle(slug: string): string {
  return TITULOS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// O conteúdo do FAQ é estático em runtime — lê uma vez e mantém em cache.
let cache: FaqCategory[] | null = null

export default defineEventHandler(async (): Promise<FaqCategory[]> => {
  if (cache) return cache

  const dir = join(process.cwd(), 'data', 'faq')
  const files = (await readdir(dir))
    .filter(f => f.startsWith('faq-') && f.endsWith('.json'))

  const categories: FaqCategory[] = []
  for (const file of files) {
    const slug = file.replace(/^faq-/, '').replace(/\.json$/, '')
    const items = JSON.parse(await readFile(join(dir, file), 'utf-8')) as FaqItem[]
    categories.push({ slug, titulo: prettyTitle(slug), count: items.length, items })
  }

  categories.sort((a, b) => {
    const ia = ORDEM.indexOf(a.slug)
    const ib = ORDEM.indexOf(b.slug)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })

  cache = categories
  return cache
})
