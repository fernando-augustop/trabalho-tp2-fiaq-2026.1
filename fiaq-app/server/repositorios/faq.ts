import atividadesDeCurso from '../../data/faq/faq-atividades-de-curso.json'
import coordenacao from '../../data/faq/faq-coordenacao.json'
import estruturaCurricular from '../../data/faq/faq-estrutura-curricular.json'
import leiaMe from '../../data/faq/faq-leia-me.json'
import matricula from '../../data/faq/faq-matricula.json'
import organizacoesEstudantis from '../../data/faq/faq-organizacoes-estudantis.json'
import trajetoriaAcademica from '../../data/faq/faq-trajetoria-academica.json'
import { getSql, isDatabaseConfigured } from '../db/index'

export interface FaqItem {
  id: string
  titulo: string
  conteudo: string
  url: string | null
}

export interface FaqCategory {
  slug: string
  titulo: string
  count: number
  items: FaqItem[]
}

interface FaqRow {
  categoria_slug: string
  categoria_titulo: string
  entrada_slug: string
  entrada_titulo: string
  conteudo: string
  url_fonte: string | null
}

const TITULOS: Record<string, string> = {
  'matricula': 'Matrícula',
  'estrutura-curricular': 'Estrutura Curricular',
  'atividades-de-curso': 'Atividades de Curso',
  'trajetoria-academica': 'Trajetória Acadêmica',
  'organizacoes-estudantis': 'Organizações Estudantis',
  'coordenacao': 'Coordenação',
  'leia-me': 'Informações Gerais'
}

const ORDEM = [
  'matricula',
  'estrutura-curricular',
  'atividades-de-curso',
  'trajetoria-academica',
  'organizacoes-estudantis',
  'coordenacao',
  'leia-me'
]

const FAQ_DATA: Array<{ slug: string, items: FaqItem[] }> = [
  { slug: 'atividades-de-curso', items: atividadesDeCurso as FaqItem[] },
  { slug: 'coordenacao', items: coordenacao as FaqItem[] },
  { slug: 'estrutura-curricular', items: estruturaCurricular as FaqItem[] },
  { slug: 'leia-me', items: leiaMe as FaqItem[] },
  { slug: 'matricula', items: matricula as FaqItem[] },
  { slug: 'organizacoes-estudantis', items: organizacoesEstudantis as FaqItem[] },
  { slug: 'trajetoria-academica', items: trajetoriaAcademica as FaqItem[] }
]

function normalizeCategorySlug(slug: string): string {
  return slug.replace(/^faq-/, '')
}

function prettyTitle(slug: string): string {
  return TITULOS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function sortCategories(categories: FaqCategory[]): FaqCategory[] {
  return categories.sort((a, b) => {
    const ia = ORDEM.indexOf(a.slug)
    const ib = ORDEM.indexOf(b.slug)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })
}

export function listarFaqDoJson(): FaqCategory[] {
  return sortCategories(FAQ_DATA.map(({ slug, items }) => ({
    slug,
    titulo: prettyTitle(slug),
    count: items.length,
    items
  })))
}

export async function listarFaqDoBanco(): Promise<FaqCategory[] | null> {
  if (!isDatabaseConfigured()) return null

  const sql = getSql()
  const rows = await sql<FaqRow[]>`
    SELECT
      c.slug AS categoria_slug,
      c.titulo AS categoria_titulo,
      e.slug AS entrada_slug,
      e.titulo AS entrada_titulo,
      e.conteudo,
      e.url_fonte
    FROM faq_categoria c
    JOIN faq_entrada e ON e.id_categoria = c.id
    ORDER BY c.ordem ASC, e.id ASC
  `

  if (rows.length === 0) return null

  const bySlug = new Map<string, FaqCategory>()

  for (const row of rows) {
    const slug = normalizeCategorySlug(row.categoria_slug)
    const category = bySlug.get(slug) ?? {
      slug,
      titulo: row.categoria_titulo,
      count: 0,
      items: []
    }

    category.items.push({
      id: row.entrada_slug,
      titulo: row.entrada_titulo,
      conteudo: row.conteudo,
      url: row.url_fonte
    })
    category.count = category.items.length
    bySlug.set(slug, category)
  }

  return sortCategories([...bySlug.values()])
}

export async function listarFaq(): Promise<{ categories: FaqCategory[], source: 'database' | 'json' }> {
  try {
    const categories = await listarFaqDoBanco()
    if (categories?.length) {
      return { categories, source: 'database' }
    }
  } catch (error) {
    console.warn('[faq] Falha ao carregar FAQ do banco; usando JSON versionado:', error)
  }

  return { categories: listarFaqDoJson(), source: 'json' }
}
