<script lang="ts">
  import { page } from '$app/state'
  import FiaqIcon from '$lib/components/FiaqIcon.svelte'
  import { findDepartamento } from '$lib/data/departamentos'

  const slug = $derived(page.params.slug ?? '')
  const departamento = $derived(findDepartamento(slug))
</script>

<svelte:head>
  <title>Contatos — {departamento?.nome ?? 'Departamento não encontrado'} — fIAq</title>
  <meta name="description" content={departamento?.descricao ?? 'Departamento não encontrado.'} />
</svelte:head>

<div class="flex-1 bg-[#f4f4f4]">
  <section class="bg-[#1a2e5a] px-6 pb-12 pt-8 sm:px-10">
    <a href="/" class="inline-flex items-center gap-1.5 text-sm font-medium text-blue-200 transition-colors hover:text-green-400">
      <FiaqIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Voltar para o início
    </a>

    <div class="mx-auto mt-4 max-w-2xl text-center">
      {#if departamento}
        <div class="mb-3 inline-flex items-center gap-1.5 rounded-full border border-green-400/30 bg-green-400/15 px-3.5 py-1.5 text-[13px] font-semibold text-green-300">
          <FiaqIcon name={departamento.icon} class="h-3.5 w-3.5" />
          {departamento.badge}
        </div>
      {/if}

      <h1 class="text-3xl font-extrabold text-white sm:text-4xl">Contatos</h1>

      <p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-blue-200">
        {departamento?.descricao ?? 'Departamento não encontrado.'}
      </p>
    </div>
  </section>

  <main class="mx-auto max-w-3xl px-5 py-8 sm:px-6">
    {#if !departamento}
      <div class="py-16 text-center">
        <p class="text-lg font-bold text-[#1a2e5a]">Departamento não encontrado.</p>
        <a href="/" class="mt-2 inline-block text-sm text-[#1a2e5a] hover:underline">Voltar para o início</a>
      </div>
    {:else}
      <div class="mb-6 overflow-hidden rounded-2xl bg-[#1a2e5a]">
        <div class="flex items-start gap-3.5 px-6 py-5">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-green-400/15 text-green-300">
            <FiaqIcon name="i-lucide-map-pin" class="h-5 w-5" />
          </span>
          <div>
            <p class="mb-1 text-sm font-bold text-white">Endereço do departamento</p>
            <p class="text-[13px] leading-relaxed text-blue-100">{departamento.endereco}</p>
          </div>
        </div>

        {#if departamento.mapsUrl}
          <iframe
            src={departamento.mapsUrl}
            class="h-64 w-full border-0 sm:h-72"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title={`Mapa de ${departamento.nome}`}
          ></iframe>
        {/if}
      </div>

      <p class="mb-4 text-[15px] font-bold text-[#1a2e5a]">Contatos principais</p>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {#each departamento.cards as card (card.nome)}
          <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex items-center gap-3 bg-[#1a2e5a] px-5 py-4">
              <span class="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-green-400/40 bg-green-400/20 text-green-300">
                <FiaqIcon name={card.icon} class="h-[18px] w-[18px]" />
              </span>
              <div class="min-w-0">
                <p class="text-[15px] font-bold text-white">{card.nome}</p>
                <p class="mt-0.5 text-xs text-blue-100">{card.local}</p>
              </div>
            </div>

            <div class="px-5 py-4">
              {#each card.itens as item, idx (item.label)}
                <div class={['flex items-start gap-2.5 py-2 text-[13px]', idx < card.itens.length - 1 ? 'border-b border-slate-100' : '']}>
                  <span class="mt-px flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1a2e5a]">
                    <FiaqIcon name={item.icon} class="h-[15px] w-[15px]" />
                  </span>
                  <div class="min-w-0">
                    <p class="text-[11px] leading-none text-slate-400">{item.label}</p>
                    {#if item.href}
                      <a
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                        class="mt-0.5 block break-words text-[13px] leading-relaxed text-blue-700 hover:underline"
                      >
                        {item.value}
                      </a>
                    {:else}
                      <span class="mt-0.5 block break-words text-[13px] leading-relaxed text-slate-800">{item.value}</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </main>
</div>
