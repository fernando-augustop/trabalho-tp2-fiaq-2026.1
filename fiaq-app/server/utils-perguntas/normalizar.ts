// O texto normalizado serve para debug e busca textual simples.
// A agregação de perguntas é feita por similaridade de embedding, não por este texto.
export function normalizarTexto(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos (acentos, cedilha, etc.)
    .replace(/[?!.,;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
