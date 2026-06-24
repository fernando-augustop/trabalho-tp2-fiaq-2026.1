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
