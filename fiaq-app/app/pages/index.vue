<template>
  <div class="flex-1">
    <!-- Hero — Assistente Virtual em destaque -->
    <div class="bg-[#1a2e5a] px-6 sm:px-10 pt-12 pb-16 text-center">
      <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-green-400/15 text-green-300 border border-green-400/30 px-3 py-1 rounded-full mb-5">
        <UIcon
          name="i-lucide-sparkles"
          class="w-3.5 h-3.5"
        />
        Assistente com IA
      </span>
      <h1 class="text-3xl sm:text-4xl font-extrabold text-white mb-3">
        Como podemos te ajudar?
      </h1>
      <p class="text-blue-200 text-base mb-8 max-w-2xl mx-auto">
        Pergunte em linguagem natural sobre matrícula, TCC, estágio, extensão e mais.
        O assistente responde com base no conteúdo oficial do CIC/UnB.
      </p>

      <form
        class="flex justify-center"
        @submit.prevent="ask"
      >
        <div class="flex w-full max-w-xl rounded-lg overflow-hidden shadow-lg border border-white/10">
          <input
            v-model="query"
            type="text"
            placeholder="Ex: Quais são as etapas da matrícula?"
            class="flex-1 bg-[#2b3f6e] text-white placeholder-gray-400 px-5 py-3.5 text-sm outline-none"
          >
          <button
            type="submit"
            class="bg-green-500 text-[#0a2e1a] font-bold px-6 py-3.5 text-sm hover:bg-green-400 transition-colors flex items-center gap-2"
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
        class="inline-flex items-center gap-1.5 text-blue-200 hover:text-green-400 text-sm font-medium mt-4 transition-colors"
      >
        <UIcon
          name="i-lucide-message-circle"
          class="w-4 h-4"
        />
        Abrir o Assistente Virtual
      </NuxtLink>
    </div>

    <!-- Categorias do FAQ -->
    <div class="px-6 sm:px-10 py-10 max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-[#1a2e5a]">
          Perguntas frequentes por tema
        </h2>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="cat in categories ?? []"
          :key="cat.slug"
          :to="`/faq/${cat.slug}`"
          class="group"
        >
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-[#1a2e5a] transition-all duration-200 cursor-pointer h-full">
            <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
              <UIcon
                :name="meta(cat.slug).icon"
                class="w-6 h-6 text-[#1a2e5a]"
              />
            </div>
            <div>
              <p class="font-bold text-[#1a2e5a] text-sm">{{ cat.titulo }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ cat.count }} {{ cat.count === 1 ? 'pergunta' : 'perguntas' }}</p>
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
