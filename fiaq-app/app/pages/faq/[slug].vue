<template>
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
      <h1 class="text-3xl sm:text-4xl font-extrabold text-white">
        {{ category?.titulo ?? 'Categoria' }}
      </h1>
      <p
        v-if="category"
        class="text-blue-200 text-sm mt-2"
      >
        {{ category.count }} {{ category.count === 1 ? 'pergunta' : 'perguntas' }} frequentes
      </p>
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
        >Ver todas as categorias</NuxtLink>
      </div>

      <!-- Lista de perguntas (acordeão) -->
      <div
        v-else
        class="flex flex-col gap-3"
      >
        <div
          v-for="item in category?.items ?? []"
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
import { marked } from 'marked'
import type { FaqCategory } from '~~/server/api/faq.get'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: categories, pending } = await useFetch<FaqCategory[]>('/api/faq')

const category = computed(() => categories.value?.find(c => c.slug === slug.value) ?? null)

useSeoMeta({
  title: () => `${category.value?.titulo ?? 'FAQ'} — fIAq`,
  description: () => `Perguntas frequentes sobre ${category.value?.titulo ?? 'o curso'} no CIC/UnB.`
})

marked.setOptions({ breaks: true, gfm: true })
function render(text: string): string {
  return marked.parse(text ?? '', { async: false }) as string
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
