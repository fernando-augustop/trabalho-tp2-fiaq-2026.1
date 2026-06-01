// Gera os JSONs do FAQ do CIC/UnB consumidos pelo RAG (data/faq/*.json)
// a partir das fontes Markdown mapeadas em data/sources/faq-cic-unb/secoes/.
//
// Cada "painel" do FAQ é um heading (qualquer nível) imediatamente seguido por
// uma linha "- ID original: `slug`" e "- Link original: <url>". O corpo vai até
// o próximo painel. Linhas como "##### Veja a [página...]" não têm `ID original`
// e portanto são preservadas como conteúdo (são links úteis da resposta).
//
// Saída: 1 JSON por arquivo de seção, no schema { id, titulo, conteudo, url }.
// Uso: node scripts/build-faq.mjs

import { readFile, writeFile, readdir, unlink } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SECOES_DIR = join(ROOT, 'data', 'sources', 'faq-cic-unb', 'secoes')
const OUT_DIR = join(ROOT, 'data', 'faq')

const HEADING = /^(#{1,6})\s+(.+?)\s*$/
const ID_LINE = /^-\s*ID original:\s*`?([^`\n]+?)`?\s*$/
const LINK_LINE = /^-\s*Link original:\s*(\S+)/
const META_LINE = /^-\s*(ID original|Link original|Painéis nesta seção)/

function cleanTitle(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [txt](url) -> txt
    .replace(/[`*#]/g, '')
    .replace(/['’]+\s*$/, '') // typos como "obrigatório?'"
    .trim()
}

function cleanBody(text) {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function firstNonEmpty(lines, from) {
  for (let j = from; j < lines.length; j++) {
    if (lines[j].trim()) return j
  }
  return -1
}

function parseSection(content) {
  const lines = content.split('\n')

  // 1) localizar os painéis: heading seguido por "- ID original:"
  const panels = []
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(HEADING)
    if (!h) continue
    const nxt = firstNonEmpty(lines, i + 1)
    if (nxt < 0) continue
    const idm = lines[nxt].match(ID_LINE)
    if (!idm) continue
    panels.push({ headingLine: i, titulo: cleanTitle(h[2]), slug: idm[1].trim() })
  }

  // 2) recortar url + conteúdo de cada painel até o próximo
  const entries = []
  for (let p = 0; p < panels.length; p++) {
    const start = panels[p].headingLine
    const end = p + 1 < panels.length ? panels[p + 1].headingLine : lines.length

    let url = ''
    const body = []
    for (let i = start + 1; i < end; i++) {
      const lk = lines[i].match(LINK_LINE)
      if (lk && !url) {
        url = lk[1]
        continue
      }
      if (META_LINE.test(lines[i])) continue
      body.push(lines[i])
    }

    const conteudo = cleanBody(body.join('\n'))
    if (!conteudo) continue // pula painéis-container vazios

    entries.push({ id: panels[p].slug, titulo: panels[p].titulo, conteudo, url })
  }

  return entries
}

async function main() {
  const files = (await readdir(SECOES_DIR)).filter(f => f.endsWith('.md')).sort()

  // limpa JSONs gerados anteriormente por este script (prefixo faq-)
  for (const f of await readdir(OUT_DIR)) {
    if (f.startsWith('faq-') && f.endsWith('.json')) {
      await unlink(join(OUT_DIR, f))
    }
  }

  const seenIds = new Set()
  let total = 0

  for (const file of files) {
    const raw = await readFile(join(SECOES_DIR, file), 'utf-8')
    const entries = parseSection(raw)

    // garante unicidade de ids entre todos os arquivos
    for (const e of entries) {
      let id = e.id
      let n = 2
      while (seenIds.has(id)) id = `${e.id}-${n++}`
      seenIds.add(id)
      e.id = id
    }

    const outName = 'faq-' + file.replace(/^\d+-/, '').replace(/\.md$/, '') + '.json'
    await writeFile(join(OUT_DIR, outName), JSON.stringify(entries, null, 2) + '\n', 'utf-8')
    total += entries.length
    console.log(`${outName.padEnd(34)} ${String(entries.length).padStart(3)} entradas`)
  }

  console.log(`\nTotal: ${total} entradas em ${files.length} arquivos.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
