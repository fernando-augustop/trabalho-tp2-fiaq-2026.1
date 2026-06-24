<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements'
  import { cn } from '$lib/utils'

  interface Props extends Omit<HTMLInputAttributes, 'value'> {
    class?: string
    value?: HTMLInputAttributes['value']
  }

  let { class: className = '', value = $bindable(), ...rest }: Props = $props()
</script>

<input
  bind:value
  class={cn(
    'h-10 w-full min-w-0 rounded-lg border border-input bg-white px-3 py-2 text-base text-[#1a2e5a] shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  {...rest}
/>
