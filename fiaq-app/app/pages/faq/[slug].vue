<template>
  <!-- eslint-disable vue/no-v-html -->
  <div class="flex-1">
    <!-- Cabeçalho da categoria -->
    <div class="bg-[#1a2e5a] px-6 sm:px-10 pt-8 pb-10">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-1.5 text-blue-200 hover:text-green-400 text-sm font-medium transition-colors mb-4"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="w-4 h-4"
        />
        Voltar para o início
      </NuxtLink>

      <div class="mx-auto max-w-3xl text-center">
        <h1 class="text-3xl font-extrabold text-white sm:text-4xl">
          {{ category?.titulo ?? 'Categoria' }}
        </h1>
        <p
          v-if="category"
          class="mt-2 text-sm text-blue-200"
        >
          {{ category.count }} {{ category.count === 1 ? 'pergunta' : 'perguntas' }} frequentes
        </p>

        <div
          v-if="category"
          class="relative mt-5"
        >
          <UIcon
            name="i-lucide-search"
            class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300"
          />
          <input
            v-model="searchQuery"
            type="search"
            aria-label="Buscar pergunta nesta categoria"
            placeholder="Buscar pergunta..."
            class="w-full rounded-lg border border-white/15 bg-white/10 py-2.5 pl-10 pr-4 text-base text-white outline-none transition-colors placeholder:text-blue-300 focus:border-white/30 focus:bg-white/15"
          >
        </div>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <!-- Categoria inexistente -->
      <div
        v-if="!pending && !category"
        class="text-center py-16"
      >
        <p class="text-[#1a2e5a] font-bold text-lg">
          Categoria não encontrada.
        </p>
        <NuxtLink
          to="/"
          class="text-green-700 hover:underline text-sm mt-2 inline-block"
        >
          Ver todas as categorias
        </NuxtLink>
      </div>

      <!-- Nenhum resultado para a busca -->
      <div
        v-else-if="category && filteredItems.length === 0"
        class="py-16 text-center"
      >
        <p class="text-lg font-bold text-[#1a2e5a]">
          Nenhuma pergunta encontrada.
        </p>
        <p class="mt-1 text-sm text-gray-500">
          Tente buscar por outro termo.
        </p>
      </div>

      <!-- Lista de perguntas (acordeão) -->
      <div
        v-else
        class="flex flex-col gap-3"
      >
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <button
            class="w-full flex items-center justify-between gap-4 text-left px-5 py-4 hover:bg-blue-50/50 transition-colors"
            :aria-expanded="open.has(item.id)"
            @click="toggle(item.id)"
          >
            <span class="font-semibold text-[#1a2e5a] text-sm">{{ item.titulo }}</span>
            <UIcon
              name="i-lucide-chevron-down"
              class="w-5 h-5 text-[#1a2e5a] shrink-0 transition-transform duration-200"
              :class="open.has(item.id) && 'rotate-180'"
            />
          </button>

          <div
            v-if="open.has(item.id)"
            class="px-5 pb-5 pt-1"
          >
            <div
              class="fiaq-prose text-sm text-gray-700 leading-relaxed"
              v-html="render(item.conteudo)"
            />
            <div
              v-if="item.url"
              class="mt-3"
            >
              <ChatSourceChip :source="{ id: item.id, titulo: 'Fonte oficial', url: item.url }" />
            </div>
          </div>
        </div>
      </div>

      <!-- CTA para o assistente -->
      <div class="mt-8 text-center">
        <p class="text-sm text-gray-500 mb-3">
          Não encontrou o que procurava?
        </p>
        <NuxtLink
          to="/chatbot"
          class="inline-flex items-center gap-2 bg-[#1a2e5a] text-white font-semibold rounded-full px-6 py-3 text-sm hover:bg-[#243d75] transition-colors shadow-md"
        >
          <UIcon
            name="i-lucide-message-circle"
            class="w-4 h-4 text-green-400"
          />
          Perguntar ao Assistente Virtual
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FaqCategory } from '~~/server/api/faq.get'
import { renderMarkdown } from '~/utils/markdown'

const route = useRoute()
const slug = computed(() => {
  const param = route.params.slug
  const value = Array.isArray(param) ? param[0] : param

  return value ?? ''
})

const { data: categories, pending } = await useFetch<FaqCategory[]>('/api/faq')

const category = computed(() => categories.value?.find(c => c.slug === slug.value) ?? null)
const searchQuery = ref('')

function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const filteredItems = computed(() => {
  const items = category.value?.items ?? []
  const query = normalizeSearchText(searchQuery.value.trim())
  if (!query) return items

  return items.filter((item) => {
    const searchable = normalizeSearchText(`${item.titulo} ${item.conteudo}`)
    return searchable.includes(query)
  })
})

useSeoMeta({
  title: () => `${category.value?.titulo ?? 'FAQ'} — fIAq`,
  description: () => `Perguntas frequentes sobre ${category.value?.titulo ?? 'o curso'} no CIC/UnB.`
})

function render(text: string): string {
  return renderMarkdown(text)
}

const open = ref<Set<string>>(new Set())
function toggle(id: string) {
  if (open.value.has(id)) open.value.delete(id)
  else open.value.add(id)
  open.value = new Set(open.value)
}
</script>

<style scoped>
.fiaq-prose :deep(p) { margin: 0 0 0.6rem; }
.fiaq-prose :deep(p:last-child) { margin-bottom: 0; }
.fiaq-prose :deep(a) { color: #2563eb; text-decoration: underline; word-break: break-word; }
.fiaq-prose :deep(ul),
.fiaq-prose :deep(ol) { margin: 0.35rem 0 0.6rem; padding-left: 1.25rem; }
.fiaq-prose :deep(ul) { list-style: disc; }
.fiaq-prose :deep(ol) { list-style: decimal; }
.fiaq-prose :deep(li) { margin: 0.2rem 0; }
.fiaq-prose :deep(strong) { font-weight: 700; }
.fiaq-prose :deep(h1),
.fiaq-prose :deep(h2),
.fiaq-prose :deep(h3) { font-weight: 700; margin: 0.6rem 0 0.3rem; color: #1a2e5a; }
</style>
