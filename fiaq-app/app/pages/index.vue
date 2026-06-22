<template>
  <div class="fiaq-main flex-1">
    <!-- Hero — Assistente Virtual em destaque -->
    <div class="fiaq-home-hero bg-[#1a2e5a] px-6 sm:px-10 pt-12 pb-16 text-center">
      <span class="fiaq-home-badge inline-flex items-center gap-1.5 text-[11px] font-semibold bg-green-400/15 text-green-300 border border-green-400/30 px-3 py-1 rounded-full mb-5">
        <UIcon
          name="i-lucide-sparkles"
          class="w-3.5 h-3.5"
        />
        Assistente com IA
      </span>
      <h1 class="fiaq-home-title text-3xl sm:text-4xl font-extrabold text-white mb-3">
        Como podemos te ajudar?
      </h1>
      <p class="fiaq-home-subtitle text-blue-200 text-base mb-8 max-w-2xl mx-auto">
        Pergunte em linguagem natural sobre matrícula, TCC, estágio, extensão e mais.
        O assistente responde com base no conteúdo oficial do CIC/UnB.
      </p>

      <form
        class="fiaq-search-form flex justify-center"
        @submit.prevent="ask"
      >
        <div class="fiaq-search-box flex w-full max-w-2xl overflow-hidden rounded-xl border border-[#00a155] bg-white shadow-[0_18px_42px_rgba(4,12,30,0.22)] ring-1 ring-[#00dc82]/35">
          <input
            v-model="query"
            type="text"
            placeholder="Ex: Quais são as etapas da matrícula?"
            aria-label="Campo de pergunta para o assistente"
            class="fiaq-search-input min-w-0 flex-1 bg-white px-5 py-4 text-base text-[#1a2e5a] outline-none placeholder:text-slate-500"
          >
          <button
            type="submit"
            class="fiaq-search-button flex shrink-0 items-center gap-2 border-l border-emerald-800/25 bg-[#00a155] px-6 py-4 text-base font-bold text-[#0a2e1a] transition-colors hover:bg-[#17b86a] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2e5a]"
          >
            <UIcon
              name="i-lucide-send"
              class="w-4 h-4"
            />
            Perguntar
          </button>
        </div>
      </form>

      <NuxtLink
        to="/chatbot"
        class="fiaq-assistant-link inline-flex items-center gap-1.5 text-blue-200 hover:text-green-400 text-sm font-medium mt-4 transition-colors"
      >
        <UIcon
          name="i-lucide-message-circle"
          class="w-4 h-4"
        />
        Abrir o Assistente Virtual
      </NuxtLink>
    </div>

    <!-- Categorias do FAQ -->
    <div class="fiaq-faq-section px-6 sm:px-10 py-10 max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h2 class="fiaq-section-title text-xl font-bold text-[#1a2e5a]">
          Perguntas frequentes por tema
        </h2>
      </div>

      <div class="fiaq-faq-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="cat in categories ?? []"
          :key="cat.slug"
          :to="`/faq/${cat.slug}`"
          class="group"
        >
          <div class="fiaq-faq-card bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-[#1a2e5a] transition-all duration-200 cursor-pointer h-full">
            <div class="fiaq-faq-icon w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
              <UIcon
                :name="meta(cat.slug).icon"
                class="w-6 h-6 text-[#1a2e5a]"
              />
            </div>
            <div>
              <p class="fiaq-faq-title font-bold text-[#1a2e5a] text-sm">{{ cat.titulo }}</p>
              <p class="fiaq-faq-count text-xs text-gray-400 mt-0.5">{{ cat.count }} {{ cat.count === 1 ? 'pergunta' : 'perguntas' }}</p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FaqCategory } from '~~/server/api/faq.get'

const { data: categories } = await useFetch<FaqCategory[]>('/api/faq')

const query = ref('')
function ask() {
  const q = query.value.trim()
  navigateTo(q ? { path: '/chatbot', query: { q } } : '/chatbot')
}

// Ícone por categoria (descrição vem do título/contagem da API).
const ICONS: Record<string, string> = {
  'matricula': 'i-lucide-clipboard-list',
  'estrutura-curricular': 'i-lucide-book-open',
  'atividades-de-curso': 'i-lucide-flask-conical',
  'trajetoria-academica': 'i-lucide-route',
  'organizacoes-estudantis': 'i-lucide-users',
  'coordenacao': 'i-lucide-phone',
  'leia-me': 'i-lucide-info'
}
function meta(slug: string) {
  return { icon: ICONS[slug] ?? 'i-lucide-help-circle' }
}
</script>
