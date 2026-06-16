import { readFile, readdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postgres from 'postgres'

const FAQ_ORDER = [
  'matricula',
  'estrutura-curricular',
  'atividades-de-curso',
  'trajetoria-academica',
  'organizacoes-estudantis',
  'coordenacao',
  'leia-me'
]

const TITULOS = {
  'matricula': 'Matrícula',
  'estrutura-curricular': 'Estrutura Curricular',
  'atividades-de-curso': 'Atividades de Curso',
  'trajetoria-academica': 'Trajetória Acadêmica',
  'organizacoes-estudantis': 'Organizações Estudantis',
  'coordenacao': 'Coordenação',
  'leia-me': 'Informações Gerais'
}

function loadEnv() {
  for (const file of ['.env', '.env.local']) {
    try {
      const raw = readFileSync(join(process.cwd(), file), 'utf8')
      for (const line of raw.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/)
        if (!match) continue

        process.env[match[1]] ??= match[2].replace(/^['"]|['"]$/g, '')
      }
    } catch {
      // Arquivo ausente: usa variaveis ja exportadas no shell/Vercel.
    }
  }
}

loadEnv()

function prettyTitle(slug) {
  return TITULOS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function normalizeCategorySlug(file) {
  return file.replace(/^faq-/, '').replace(/\.json$/, '')
}

async function loadFaqEntries() {
  const faqDir = join(process.cwd(), 'data', 'faq')
  const files = (await readdir(faqDir))
    .filter(file => file.startsWith('faq-') && file.endsWith('.json'))

  const categories = []

  for (const file of files) {
    const slug = normalizeCategorySlug(file)
    const entries = JSON.parse(await readFile(join(faqDir, file), 'utf-8'))
    categories.push({
      slug,
      titulo: prettyTitle(slug),
      descricao: `Perguntas sobre ${prettyTitle(slug).toLowerCase()}`,
      ordem: FAQ_ORDER.includes(slug) ? FAQ_ORDER.indexOf(slug) + 1 : 999,
      entries
    })
  }

  return categories.sort((a, b) => a.ordem - b.ordem)
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL não configurada. Use uma connection string com permissão de escrita para executar o seed.')
  }

  const sql = postgres(connectionString, {
    max: 1,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10
  })

  const categories = await loadFaqEntries()

  try {
    await sql.begin(async (tx) => {
      const activeCategorySlugs = []
      const activeEntrySlugs = []

      for (const category of categories) {
        activeCategorySlugs.push(category.slug)

        const rows = await tx`
          INSERT INTO faq_categoria (slug, titulo, descricao, ordem)
          VALUES (${category.slug}, ${category.titulo}, ${category.descricao}, ${category.ordem})
          ON CONFLICT (slug) DO UPDATE SET
            titulo = EXCLUDED.titulo,
            descricao = EXCLUDED.descricao,
            ordem = EXCLUDED.ordem
          RETURNING id
        `
        const categoryId = rows[0].id

        for (const entry of category.entries) {
          activeEntrySlugs.push(entry.id)
          await tx`
            INSERT INTO faq_entrada (id_categoria, slug, titulo, conteudo, url_fonte, dthr_atualizacao)
            VALUES (${categoryId}, ${entry.id}, ${entry.titulo}, ${entry.conteudo}, ${entry.url ?? null}, CURRENT_TIMESTAMP)
            ON CONFLICT (slug) DO UPDATE SET
              id_categoria = EXCLUDED.id_categoria,
              titulo = EXCLUDED.titulo,
              conteudo = EXCLUDED.conteudo,
              url_fonte = EXCLUDED.url_fonte,
              dthr_atualizacao = CURRENT_TIMESTAMP
          `
        }
      }

      if (activeEntrySlugs.length > 0) {
        await tx`
          DELETE FROM faq_entrada
          WHERE slug NOT IN ${tx(activeEntrySlugs)}
        `
      }

      if (activeCategorySlugs.length > 0) {
        await tx`
          DELETE FROM faq_categoria
          WHERE slug NOT IN ${tx(activeCategorySlugs)}
            AND NOT EXISTS (
              SELECT 1
              FROM faq_entrada e
              WHERE e.id_categoria = faq_categoria.id
            )
        `
      }
    })

    const total = categories.reduce((sum, category) => sum + category.entries.length, 0)
    console.log(`Seed FAQ concluído: ${categories.length} categorias, ${total} entradas.`)
  } finally {
    await sql.end()
  }
}

main().catch((error) => {
  console.error('Falha no seed do FAQ:', error)
  process.exit(1)
})
