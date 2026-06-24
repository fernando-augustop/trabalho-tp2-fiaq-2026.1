<script lang="ts">
  import FiaqIcon from '$lib/components/FiaqIcon.svelte'
  import type { SearchActivity, Source } from '$lib/stores/fiaq-chat'

  interface SourceLine {
    id: string
    kind: 'rag' | 'web'
    status: SearchActivity['status']
    title: string
    host: string
  }

  interface Props {
    activities?: SearchActivity[]
    compact?: boolean
  }

  let { activities = [], compact = false }: Props = $props()

  const fallbackActivities = $derived<SearchActivity[]>([
    {
      id: 'preparing',
      kind: 'rag',
      status: 'active',
      label: 'Abrindo fontes do fIAq',
      detail: 'Consultando documentos e respostas oficiais disponíveis.'
    }
  ])

  const visibleActivities = $derived(activities.length ? activities : fallbackActivities)
  const activeActivity = $derived(visibleActivities.find(activity => activity.status === 'active'))
  const wrapperClass = $derived([
    'text-left leading-normal',
    compact
      ? 'mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5'
      : 'w-full max-w-[min(56rem,92vw)] rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm'
  ])

  const sourceLines = $derived.by<SourceLine[]>(() => {
    const lines: SourceLine[] = []

    for (const activity of visibleActivities) {
      for (const source of activity.sources ?? []) {
        lines.push({
          id: `${activity.id}:${source.id}`,
          kind: source.kind === 'web' ? 'web' : 'rag',
          status: activity.status,
          title: sourceTitle(source),
          host: sourceHost(source.url) || (source.kind === 'web' ? '' : 'fonte oficial')
        })
      }
    }

    if (lines.length) return lines.slice(0, 6)

    const activity = activeActivity ?? visibleActivities.find(item => item.status !== 'skipped') ?? visibleActivities[0]
    if (!activity) return []

    return [{
      id: activity.id,
      kind: activity.kind === 'web' ? 'web' : 'rag',
      status: activity.status,
      title: activity.label,
      host: activity.kind === 'web' ? 'fontes oficiais' : 'fonte oficial'
    }]
  })

  function lineIcon(line: SourceLine): string {
    if (line.status === 'done') return 'i-lucide-check'
    if (line.status === 'error') return 'i-lucide-circle-alert'
    if (line.kind === 'web') return 'i-lucide-globe-2'
    return 'i-lucide-book-open'
  }

  function lineIconClass(line: SourceLine): string {
    if (line.status === 'error') return 'bg-amber-50 text-amber-700'
    if (line.status === 'done') return 'bg-emerald-50 text-emerald-700'
    if (line.kind === 'web') return 'bg-emerald-50 text-emerald-700'
    return 'bg-slate-100 text-[#1a2e5a]'
  }

  function sourceTitle(source: Source): string {
    return (source.titulo || source.url || 'Fonte oficial').replace(/\s+/g, ' ').trim()
  }

  function sourceHost(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return ''
    }
  }
</script>

<div class={wrapperClass}>
  <div class="flex flex-wrap items-center justify-between gap-2">
    <p class="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
      <FiaqIcon name="i-lucide-list-checks" class="h-3.5 w-3.5 text-[#00a155]" />
      Fontes verificadas
    </p>
    {#if activeActivity}
      <span class="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse"></span>
        {activeActivity.label}
      </span>
    {/if}
  </div>

  <div class={['mt-2 grid gap-1.5', compact ? 'text-xs' : 'text-sm']}>
    {#each sourceLines as line (line.id)}
      <div class="flex min-h-9 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <span class={['flex h-5 w-5 shrink-0 items-center justify-center rounded-md', lineIconClass(line)]}>
          <FiaqIcon name={lineIcon(line)} class="h-3.5 w-3.5" />
        </span>
        {#if line.kind === 'web'}
          <span class="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-emerald-700 ring-1 ring-emerald-100">web</span>
        {/if}
        <span class="min-w-0 flex-1 truncate font-semibold text-[#1a2e5a]">{line.title}</span>
        {#if line.host}
          <span class="hidden shrink-0 truncate text-[11px] font-medium text-slate-400 sm:max-w-40 sm:inline">{line.host}</span>
        {/if}
        {#if line.status === 'active'}
          <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 motion-safe:animate-pulse" aria-label="Em verificação"></span>
        {/if}
      </div>
    {/each}
  </div>
</div>
