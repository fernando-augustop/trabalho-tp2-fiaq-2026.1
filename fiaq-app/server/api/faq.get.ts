import atividadesDeCurso from '../../data/faq/faq-atividades-de-curso.json'
import coordenacao from '../../data/faq/faq-coordenacao.json'
import estruturaCurricular from '../../data/faq/faq-estrutura-curricular.json'
import leiaMe from '../../data/faq/faq-leia-me.json'
import matricula from '../../data/faq/faq-matricula.json'
import organizacoesEstudantis from '../../data/faq/faq-organizacoes-estudantis.json'
import trajetoriaAcademica from '../../data/faq/faq-trajetoria-academica.json'

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

const FAQ_DATA: Array<{ slug: string, items: FaqItem[] }> = [
  { slug: 'atividades-de-curso', items: atividadesDeCurso as FaqItem[] },
  { slug: 'coordenacao', items: coordenacao as FaqItem[] },
  { slug: 'estrutura-curricular', items: estruturaCurricular as FaqItem[] },
  { slug: 'leia-me', items: leiaMe as FaqItem[] },
  { slug: 'matricula', items: matricula as FaqItem[] },
  { slug: 'organizacoes-estudantis', items: organizacoesEstudantis as FaqItem[] },
  { slug: 'trajetoria-academica', items: trajetoriaAcademica as FaqItem[] }
]

function prettyTitle(slug: string): string {
  return TITULOS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// O conteúdo do FAQ é estático em runtime — lê uma vez e mantém em cache.
let cache: FaqCategory[] | null = null

export default defineEventHandler(async (): Promise<FaqCategory[]> => {
  if (cache) return cache

  const categories: FaqCategory[] = FAQ_DATA.map(({ slug, items }) => ({
    slug,
    titulo: prettyTitle(slug),
    count: items.length,
    items
  }))

  categories.sort((a, b) => {
    const ia = ORDEM.indexOf(a.slug)
    const ib = ORDEM.indexOf(b.slug)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })

  cache = categories
  return cache
})
