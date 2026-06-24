<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import type { Snippet } from 'svelte'
  import { cn } from '$lib/utils'

  type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive'
  type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

  interface Props extends HTMLButtonAttributes {
    variant?: ButtonVariant
    size?: ButtonSize
    class?: string
    children?: Snippet
  }

  let {
    variant = 'default',
    size = 'default',
    class: className = '',
    type = 'button',
    children,
    ...rest
  }: Props = $props()

  const variants: Record<ButtonVariant, string> = {
    default: 'bg-primary text-primary-foreground shadow-sm hover:bg-green-500',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-slate-200',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-white shadow-sm hover:bg-red-600'
  }

  const sizes: Record<ButtonSize, string> = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-lg px-8',
    icon: 'h-10 w-10'
  }
</script>

<button
  type={type}
  class={cn(
    'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-bold transition-[background-color,border-color,color,box-shadow,transform] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className
  )}
  {...rest}
>
  {@render children?.()}
</button>
