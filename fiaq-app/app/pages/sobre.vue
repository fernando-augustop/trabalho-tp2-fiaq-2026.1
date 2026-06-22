<template>
  <div class="flex-1">
    <!-- Cabeçalho -->
    <div class="bg-[#1a2e5a] px-6 sm:px-10 pt-12 pb-14 text-center">
      <div class="flex flex-col items-center gap-3">
        <FiaqBrand
          :link="false"
          size="sm"
        />
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white">
          Sobre o Projeto
        </h1>
      </div>
      <p class="text-blue-200 text-sm sm:text-base mt-3 max-w-2xl mx-auto">
        Portal de perguntas frequentes e assistente virtual com IA do Departamento de
        Ciência da Computação da Universidade de Brasília.
      </p>
    </div>

    <div class="max-w-5xl mx-auto px-6 sm:px-10 py-12 flex flex-col gap-14">
      <!-- Objetivo do Sistema -->
      <section class="flex items-start gap-4 sm:gap-5">
        <div class="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1a2e5a]">
          <UIcon
            name="i-lucide-target"
            class="h-6 w-6 sm:h-7 sm:w-7"
          />
        </div>
        <div>
          <h2 class="text-xl sm:text-2xl font-extrabold text-[#1a2e5a] mb-2">
            Objetivo do Sistema
          </h2>
          <p class="text-sm sm:text-base text-gray-600 leading-relaxed">
            As informações do CIC/UnB estão espalhadas por sites, PDFs e setores. O fIAq
            centraliza tudo numa interface acessível, com um FAQ navegável por tema e um
            assistente virtual que responde em linguagem natural usando uma <strong class="text-[#1a2e5a]">base de conhecimento</strong>
            com conteúdo institucional oficial — sempre
            citando as fontes consultadas.
          </p>
        </div>
      </section>

      <!-- Tecnologias Utilizadas -->
      <section>
        <h2 class="text-xl sm:text-2xl font-extrabold text-[#1a2e5a] mb-6 text-center">
          Tecnologias Utilizadas
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            v-for="stack in techStacks"
            :key="stack.title"
            class="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-6 flex flex-col items-center text-center gap-3"
          >
            <h3 class="font-bold text-[#1a2e5a] text-sm sm:text-base">
              {{ stack.title }}
            </h3>
            <div class="flex items-center gap-3">
              <div
                v-for="item in stack.items"
                :key="item.label"
                class="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-[#1a2e5a]"
                :title="item.label"
              >
                <UIcon
                  :name="item.icon"
                  class="h-5 w-5"
                />
              </div>
            </div>
            <p class="text-xs text-gray-500 leading-relaxed">
              {{ stack.description }}
            </p>
          </div>
        </div>
      </section>

      <!-- Como a IA Funciona -->
      <section class="flex items-start gap-4 sm:gap-5">
        <div class="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
          <UIcon
            name="i-lucide-brain-circuit"
            class="h-6 w-6 sm:h-7 sm:w-7"
          />
        </div>
        <div>
          <h2 class="text-xl sm:text-2xl font-extrabold text-[#1a2e5a] mb-2">
            Como a IA Funciona
          </h2>
          <p class="text-sm sm:text-base text-gray-600 leading-relaxed">
            Quando você faz uma pergunta, o assistente gera um <em>embedding</em> do texto
            e busca os trechos mais relevantes do conteúdo oficial do CIC/UnB, indexados
            com <strong class="text-[#1a2e5a]">pgvector</strong> no PostgreSQL. Esses trechos
            são usados como contexto para o modelo de linguagem gerar uma resposta — que
            cita as fontes reais consultadas em vez de inventar links. Se o banco de dados
            não estiver disponível, o assistente usa um índice local pré-computado como
            alternativa de apoio.
          </p>
        </div>
      </section>

      <!-- Equipe -->
      <section>
        <h2 class="text-xl sm:text-2xl font-extrabold text-[#1a2e5a] mb-6 text-center">
          Equipe
        </h2>
        <p class="text-xs sm:text-sm text-gray-500 text-center mb-6 -mt-3">
          Projeto desenvolvido por alunos da disciplina de Técnicas de Programação 2 — UnB 2026.1
        </p>
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <a
            v-for="(member, idx) in team"
            :key="member.github"
            :href="`https://github.com/${member.github}`"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-blue-50/50"
            :class="idx < team.length - 1 ? 'border-b border-gray-100' : ''"
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1a2e5a]">
              <UIcon
                name="i-lucide-github"
                class="h-4 w-4"
              />
            </span>
            <span class="font-semibold text-[#1a2e5a]">{{ member.name }}</span>
            <span class="text-gray-400 text-xs sm:text-sm">@{{ member.github }}</span>
          </a>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Sobre o Projeto — fIAq',
  description: 'Objetivo, tecnologias, funcionamento da IA e equipe do projeto fIAq — assistente virtual do CIC/UnB.'
})

const techStacks = [
  {
    title: 'Framework & UI',
    description: 'Nuxt 4, Vue 3, Nuxt UI 4, Tailwind CSS 4',
    items: [
      { label: 'Nuxt', icon: 'i-lucide-triangle' },
      { label: 'Vue', icon: 'i-lucide-component' },
      { label: 'Tailwind CSS', icon: 'i-lucide-palette' }
    ]
  },
  {
    title: 'IA (Chat & Embeddings)',
    description: 'OpenRouter (nuvem) ou Ollama (local)',
    items: [
      { label: 'OpenRouter', icon: 'i-lucide-route' },
      { label: 'Ollama', icon: 'i-lucide-cpu' }
    ]
  },
  {
    title: 'Banco / Conhecimento',
    description: 'PostgreSQL + pgvector (Supabase no deploy)',
    items: [
      { label: 'PostgreSQL', icon: 'i-lucide-database' },
      { label: 'pgvector', icon: 'i-lucide-spline' },
      { label: 'Supabase', icon: 'i-lucide-zap' }
    ]
  }
]

const team = [
  { name: 'Fernando Augusto', github: 'fernando-augustop' },
  { name: 'Gustavo Nascimento', github: 'PavanelliGustavo' },
  { name: 'Eduardo Rocha', github: 'eduardofgc' },
  { name: 'Lucas Pereira', github: 'lucsap' },
  { name: 'Samara Gomes', github: 'samaragomess' },
  { name: 'Augusto Faller', github: 'tosgual' },
  { name: 'Lucas Centurion Netto', github: 'LucasCenturionNetto' },
  { name: 'Ricardo Rian', github: 'RianRSM' },
  { name: 'Érica Feitosa', github: 'ericafeitosa' }
]
</script>
