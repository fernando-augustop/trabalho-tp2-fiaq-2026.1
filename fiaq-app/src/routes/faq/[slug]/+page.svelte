<script lang="ts">
  import { page } from '$app/state'
  import { createQuery } from '@tanstack/svelte-query'
  import FiaqIcon from '$lib/components/FiaqIcon.svelte'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import SourceChip from '$lib/components/chat/SourceChip.svelte'
  import type { FaqCategory, FaqItem } from '$lib/types/faq'
  import { apiFetch } from '$lib/utils/api'
  import { renderMarkdown } from '$lib/utils/markdown'

  const skeletonQuestions = ['faq-question-loading-1', 'faq-question-loading-2', 'faq-question-loading-3', 'faq-question-loading-4']

  let searchQuery = $state('')
  let openIds = $state<string[]>([])

  const slug = $derived(page.params.slug ?? '')
  const faqQuery = createQuery<FaqCategory[]>(() => ({
    queryKey: ['faq-categories'],
    queryFn: () => apiFetch<FaqCategory[]>('/api/faq'),
    staleTime: 5 * 60_000
  }))

  const categories = $derived<FaqCategory[]>(faqQuery.data ?? [])
  const category = $derived(categories.find((c: FaqCategory) => c.slug === slug) ?? null)
  const filteredItems = $derived.by<FaqItem[]>(() => {
    const items = category?.items ?? []
    const query = normalizeSearchText(searchQuery.trim())
    if (!query) return items

    return items.filter((item: FaqItem) => {
      const searchable = normalizeSearchText(`${item.titulo} ${item.conteudo}`)
      return searchable.includes(query)
    })
  })

  function normalizeSearchText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  }

  function toggle(id: string) {
    openIds = openIds.includes(id)
      ? openIds.filter(openId => openId !== id)
      : [...openIds, id]
  }
</script>

<svelte:head>
  <title>{category?.titulo ?? 'FAQ'} — fIAq</title>
  <meta
    name="description"
    content={`Perguntas frequentes sobre ${category?.titulo ?? 'o curso'} no CIC/UnB.`}
  />
</svelte:head>

<div class="flex-1">
  <section class="bg-[#1a2e5a] px-6 pb-10 pt-8 sm:px-10">
    <a href="/" class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-200 transition-colors hover:text-green-400">
      <FiaqIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Voltar para o início
    </a>

    <div class="mx-auto max-w-3xl text-center">
      <h1 class="text-3xl font-extrabold text-white sm:text-4xl">
        {category?.titulo ?? 'Categoria'}
      </h1>
      {#if category}
        <p class="mt-2 text-sm text-blue-200">
          {category.count} {category.count === 1 ? 'pergunta' : 'perguntas'} frequentes
        </p>

        <div class="relative mt-5">
          <FiaqIcon name="i-lucide-search" class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300" />
          <Input
            bind:value={searchQuery}
            type="search"
            name="faq-search"
            autocomplete="off"
            aria-label="Buscar pergunta nesta categoria"
            placeholder="Buscar pergunta..."
            class="w-full rounded-lg border border-white/15 bg-white/10 py-2.5 pl-10 pr-4 text-base text-white shadow-none outline-none transition-colors placeholder:text-blue-300 focus:border-white/30 focus:bg-white/15 focus-visible:ring-0"
          />
        </div>
      {/if}
    </div>
  </section>

  <main class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
    {#if !faqQuery.isLoading && !category}
      <div class="py-16 text-center">
        <p class="text-lg font-bold text-[#1a2e5a]">Categoria não encontrada.</p>
        <a href="/" class="mt-2 inline-block text-sm text-green-700 hover:underline">Ver todas as categorias</a>
      </div>
    {:else if category && filteredItems.length === 0}
      <div class="py-16 text-center">
        <p class="text-lg font-bold text-[#1a2e5a]">Nenhuma pergunta encontrada.</p>
        <p class="mt-1 text-sm text-gray-500">Tente buscar por outro termo.</p>
      </div>
    {:else}
      <div class="flex flex-col gap-3">
        {#if faqQuery.isLoading}
          {#each skeletonQuestions as skeletonId (skeletonId)}
            <div class="h-16 animate-pulse rounded-2xl border border-gray-200 bg-white shadow-sm" aria-hidden="true"></div>
          {/each}
        {/if}

        {#each filteredItems as item (item.id)}
          <article class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <Button
              variant="ghost"
              class="flex h-auto min-h-14 w-full items-center justify-between gap-3 whitespace-normal px-5 py-4 text-left transition-colors hover:bg-blue-50/50"
              aria-expanded={openIds.includes(item.id)}
              onclick={() => toggle(item.id)}
            >
              <span class="min-w-0 flex-1 break-words text-sm font-semibold leading-snug text-[#1a2e5a]">{item.titulo}</span>
              <FiaqIcon name="i-lucide-chevron-down" class={`h-5 w-5 shrink-0 text-[#1a2e5a] transition-transform duration-200 ${openIds.includes(item.id) ? 'rotate-180' : ''}`} />
            </Button>

            {#if openIds.includes(item.id)}
              <div class="px-5 pb-5 pt-1">
                <div class="fiaq-prose text-sm leading-relaxed text-gray-700">{@html renderMarkdown(item.conteudo)}</div>
                {#if item.url}
                  <div class="mt-3">
                    <SourceChip source={{ id: item.id, titulo: 'Fonte oficial', url: item.url, kind: 'rag' }} />
                  </div>
                {/if}
              </div>
            {/if}
          </article>
        {/each}
      </div>
    {/if}

    <div class="mt-8 text-center">
      <p class="mb-3 text-sm text-gray-500">Não encontrou o que procurava?</p>
      <a href="/chatbot" class="inline-flex items-center gap-2 rounded-full bg-[#1a2e5a] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#243d75]">
        <FiaqIcon name="i-lucide-message-circle" class="h-4 w-4 text-green-400" />
        Perguntar ao Assistente Virtual
      </a>
    </div>
  </main>
</div>

<style>
  .fiaq-prose :global(p) { margin: 0 0 0.6rem; }
  .fiaq-prose :global(p:last-child) { margin-bottom: 0; }
  .fiaq-prose :global(a) { color: #2563eb; text-decoration: underline; word-break: break-word; }
  .fiaq-prose :global(ul),
  .fiaq-prose :global(ol) { margin: 0.35rem 0 0.6rem; padding-left: 1.25rem; }
  .fiaq-prose :global(ul) { list-style: disc; }
  .fiaq-prose :global(ol) { list-style: decimal; }
  .fiaq-prose :global(li) { margin: 0.2rem 0; }
  .fiaq-prose :global(strong) { font-weight: 700; }
  .fiaq-prose :global(h1),
  .fiaq-prose :global(h2),
  .fiaq-prose :global(h3) {
    font-weight: 700;
    margin: 0.6rem 0 0.3rem;
    color: #1a2e5a;
  }
</style>
