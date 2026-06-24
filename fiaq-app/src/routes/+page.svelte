<script lang="ts">
  import { goto } from '$app/navigation'
  import { createQuery } from '@tanstack/svelte-query'
  import FiaqIcon from '$lib/components/FiaqIcon.svelte'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import type { FaqCategory } from '$lib/types/faq'
  import { apiFetch } from '$lib/utils/api'

  let query = $state('')

  const faqQuery = createQuery<FaqCategory[]>(() => ({
    queryKey: ['faq-categories'],
    queryFn: () => apiFetch<FaqCategory[]>('/api/faq'),
    staleTime: 5 * 60_000
  }))

  const categories = $derived(faqQuery.data ?? [])

  const ICONS: Record<string, string> = {
    matricula: 'i-lucide-clipboard-list',
    'estrutura-curricular': 'i-lucide-book-open',
    'atividades-de-curso': 'i-lucide-flask-conical',
    'trajetoria-academica': 'i-lucide-route',
    'organizacoes-estudantis': 'i-lucide-users',
    coordenacao: 'i-lucide-phone',
    'leia-me': 'i-lucide-info'
  }
  const skeletonCards = ['faq-loading-1', 'faq-loading-2', 'faq-loading-3', 'faq-loading-4', 'faq-loading-5', 'faq-loading-6']

  function iconFor(slug: string) {
    return ICONS[slug] ?? 'i-lucide-help-circle'
  }

  function ask() {
    const q = query.trim()
    void goto(q ? `/chatbot?q=${encodeURIComponent(q)}` : '/chatbot')
  }
</script>

<svelte:head>
  <title>fIAq — Assistente do CIC/UnB</title>
  <meta
    name="description"
    content="Pergunte ao assistente virtual do CIC/UnB sobre matrícula, TCC, estágio, extensão e mais."
  />
</svelte:head>

<div class="fiaq-main flex-1">
  <section class="fiaq-home-hero bg-[#1a2e5a] px-6 pb-16 pt-12 text-center sm:px-10">
    <span class="fiaq-home-badge mb-5 inline-flex items-center gap-1.5 rounded-full border border-green-400/30 bg-green-400/15 px-3 py-1 text-[11px] font-semibold text-green-300">
      <FiaqIcon name="i-lucide-sparkles" class="h-3.5 w-3.5" />
      Assistente com IA
    </span>
    <h1 class="fiaq-home-title mb-3 text-3xl font-extrabold text-white sm:text-4xl">
      Como podemos te ajudar?
    </h1>
    <p class="fiaq-home-subtitle mx-auto mb-8 max-w-2xl text-base text-blue-200">
      Pergunte em linguagem natural sobre matrícula, TCC, estágio, extensão e mais.
      O assistente responde com base no conteúdo oficial do CIC/UnB.
    </p>

    <form class="fiaq-search-form flex justify-center" onsubmit={(event) => { event.preventDefault(); ask() }}>
      <div class="fiaq-search-box flex w-full max-w-2xl overflow-hidden rounded-xl border border-[#00a155] bg-white shadow-[0_18px_42px_rgba(4,12,30,0.22)] ring-1 ring-[#00dc82]/35">
        <Input
          bind:value={query}
          type="text"
          name="home-question"
          autocomplete="off"
          placeholder="Digite sua pergunta..."
          aria-label="Campo de pergunta para o assistente"
          class="fiaq-search-input h-auto min-w-0 flex-1 border-0 bg-white px-5 py-4 text-base text-[#1a2e5a] shadow-none outline-none placeholder:text-slate-500 focus-visible:ring-0"
        />
        <Button
          type="submit"
          aria-label="Perguntar ao assistente"
          class="fiaq-search-button flex shrink-0 items-center gap-2 rounded-none border-l border-emerald-800/25 bg-[#00a155] px-4 py-4 text-base font-bold text-[#0a2e1a] transition-colors hover:bg-[#17b86a] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2e5a] sm:px-6"
        >
          <FiaqIcon name="i-lucide-send" class="h-5 w-5 sm:h-4 sm:w-4" />
          <span class="hidden sm:inline">Perguntar</span>
        </Button>
      </div>
    </form>

    <a href="/chatbot" class="fiaq-assistant-link mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-200 transition-colors hover:text-green-400">
      <FiaqIcon name="i-lucide-message-circle" class="h-4 w-4" />
      Abrir o Assistente Virtual
    </a>
  </section>

  <section class="fiaq-faq-section mx-auto max-w-5xl px-6 py-10 sm:px-10">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="fiaq-section-title text-xl font-bold text-[#1a2e5a]">
        Perguntas frequentes por tema
      </h2>
    </div>

    {#if faqQuery.isLoading}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each skeletonCards as skeletonId (skeletonId)}
          <div class="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" aria-hidden="true"></div>
        {/each}
      </div>
    {:else if faqQuery.isError}
      <div class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
        Não foi possível carregar o FAQ agora.
      </div>
    {:else}
      <div class="fiaq-faq-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each categories as cat (cat.slug)}
          <a href={`/faq/${cat.slug}`} class="group">
            <div class="fiaq-faq-card flex h-full cursor-pointer items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-[#1a2e5a] hover:shadow-md">
              <div class="fiaq-faq-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-blue-50">
                <FiaqIcon name={iconFor(cat.slug)} class="h-6 w-6 text-[#1a2e5a]" />
              </div>
              <div>
                <p class="fiaq-faq-title text-sm font-bold text-[#1a2e5a]">{cat.titulo}</p>
                <p class="fiaq-faq-count mt-0.5 text-xs text-gray-400">
                  {cat.count} {cat.count === 1 ? 'pergunta' : 'perguntas'}
                </p>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </section>
</div>
