<script lang="ts">
  interface Props {
    class?: string
    compact?: boolean
    link?: boolean
    size?: 'sm' | 'md'
  }

  let { class: className = '', compact = false, link = true, size = 'md' }: Props = $props()
  const isCompact = $derived(compact || size === 'sm')
  const avatarClass = $derived(
    `flex shrink-0 items-center justify-center overflow-hidden bg-white shadow-sm ring-1 ring-white/35 ${
      isCompact ? 'h-10 w-10 rounded-xl' : 'h-12 w-12 rounded-2xl'
    }`
  )
  const brandTextClass = $derived(
    `font-black tracking-normal text-white ${isCompact ? 'text-2xl' : 'text-3xl sm:text-4xl'}`
  )
</script>

{#if link}
  <a
    href="/"
    aria-label="fIAq - ir para o início"
    class={`group inline-flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${className}`}
  >
    <span
      class={`${avatarClass} transition-[box-shadow,transform] group-focus-visible:ring-green-400`}
    >
      <img src="/sarue-avatar.png" alt="" width={isCompact ? 40 : 48} height={isCompact ? 40 : 48} class="h-full w-full object-contain" />
    </span>
    <span class={brandTextClass}>
      f<span class="text-[var(--fiaq-green-bright)]">IA</span>q
    </span>
  </a>
{:else}
  <span class={`inline-flex items-center gap-2 ${className}`} aria-label="fIAq">
    <span class={avatarClass}>
      <img src="/sarue-avatar.png" alt="" width={isCompact ? 40 : 48} height={isCompact ? 40 : 48} class="h-full w-full object-contain" />
    </span>
    <span class={brandTextClass}>
      f<span class="text-[var(--fiaq-green-bright)]">IA</span>q
    </span>
  </span>
{/if}
