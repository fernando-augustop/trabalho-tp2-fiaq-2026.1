<script lang="ts">
  interface Props {
    class?: string
    'aria-hidden'?: boolean | 'true' | 'false'
  }

  let { class: className = '', 'aria-hidden': ariaHidden = true }: Props = $props()
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className}
  aria-hidden={ariaHidden}
>
  <path d="M15 22v-3.9a3.4 3.4 0 0 0-.95-2.64c3.16-.35 6.48-1.55 6.48-7A5.48 5.48 0 0 0 19.07 4.7a5.1 5.1 0 0 0-.14-3.73s-1.18-.38-3.88 1.47a13.38 13.38 0 0 0-7.1 0C5.25.59 4.07.97 4.07.97a5.1 5.1 0 0 0-.14 3.73 5.48 5.48 0 0 0-1.46 3.78c0 5.42 3.3 6.62 6.45 7A3.4 3.4 0 0 0 8 18.1V22" />
  <path d="M8 19c-3 .9-3-1.5-4.2-1.8" />
</svg>
