<script lang="ts">
  interface Props {
    class?: string
    compact?: boolean
    link?: boolean
    size?: 'sm' | 'md'
  }

  let { class: className = '', compact = false, link = true, size = 'md' }: Props = $props()
  const isCompact = $derived(compact || size === 'sm')
</script>

{#if link}
  <a
    href="/"
    aria-label="fIAq - ir para o início"
    class={`group inline-flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${className}`}
  >
    <span
      class="flex shrink-0 items-center justify-center overflow-hidden bg-white shadow-sm ring-1 ring-white/35 transition-[box-shadow,transform] group-focus-visible:ring-green-400"
      class:h-12={!isCompact}
      class:w-12={!isCompact}
      class:rounded-2xl={!isCompact}
      class:h-10={isCompact}
      class:w-10={isCompact}
      class:rounded-xl={isCompact}
    >
      <img src="/sarue-avatar.png" alt="" width={isCompact ? 40 : 48} height={isCompact ? 40 : 48} class="h-full w-full object-contain" />
    </span>
    <span class="font-black tracking-normal text-white" class:text-3xl={!isCompact} class:sm:text-4xl={!isCompact} class:text-2xl={isCompact}>
      f<span class="text-[var(--fiaq-green-bright)]">IA</span>q
    </span>
  </a>
{:else}
  <span class={`inline-flex items-center gap-2 ${className}`} aria-label="fIAq">
    <span
      class="flex shrink-0 items-center justify-center overflow-hidden bg-white shadow-sm ring-1 ring-white/35"
      class:h-12={!isCompact}
      class:w-12={!isCompact}
      class:rounded-2xl={!isCompact}
      class:h-10={isCompact}
      class:w-10={isCompact}
      class:rounded-xl={isCompact}
    >
      <img src="/sarue-avatar.png" alt="" width={isCompact ? 40 : 48} height={isCompact ? 40 : 48} class="h-full w-full object-contain" />
    </span>
    <span class="font-black tracking-normal text-white" class:text-3xl={!isCompact} class:sm:text-4xl={!isCompact} class:text-2xl={isCompact}>
      f<span class="text-[var(--fiaq-green-bright)]">IA</span>q
    </span>
  </span>
{/if}
