<script lang="ts">
  import { onDestroy, tick } from 'svelte'
  import FiaqIcon from '$lib/components/FiaqIcon.svelte'
  import Button from '$lib/components/ui/button.svelte'
  import { departamentos } from '$lib/data/departamentos'
  import { closeDepartmentsSidebar, departmentsSidebarOpen } from '$lib/stores/departments-sidebar'

  let panelEl = $state<HTMLElement | null>(null)
  let restoreFocusEl: HTMLElement | null = null

  function focusableElements(): HTMLElement[] {
    if (!panelEl) return []

    return Array.from(panelEl.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(element => !element.hasAttribute('disabled') && element.tabIndex !== -1)
  }

  function focusFirstControl() {
    const first = focusableElements()[0]
    const target = first ?? panelEl
    target?.focus()
  }

  $effect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = $departmentsSidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  })

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeDepartmentsSidebar()
      return
    }

    if (event.key !== 'Tab' || !panelEl) return

    const focusable = focusableElements()

    if (!focusable.length) {
      event.preventDefault()
      panelEl.focus()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    const activeIsFocusable = active instanceof HTMLElement && focusable.includes(active)

    if (!panelEl.contains(active) || active === panelEl || !activeIsFocusable) {
      event.preventDefault()
      const target = event.shiftKey ? last : first
      target.focus()
    } else if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  $effect(() => {
    if (typeof document === 'undefined' || !$departmentsSidebarOpen) return

    restoreFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.addEventListener('keydown', handleKeydown)
    tick().then(focusFirstControl)

    return () => {
      document.removeEventListener('keydown', handleKeydown)
      restoreFocusEl?.focus()
      restoreFocusEl = null
    }
  })

  onDestroy(() => {
    if (typeof document !== 'undefined') document.body.style.overflow = ''
  })
</script>

{#if $departmentsSidebarOpen}
  <div
    class="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-sm"
    role="presentation"
    onclick={closeDepartmentsSidebar}
  ></div>
  <div
    bind:this={panelEl}
    class="fixed right-0 top-0 z-[80] flex h-dvh w-[min(88vw,24rem)] flex-col overflow-hidden bg-[#1a2e5a] text-white shadow-2xl"
    role="dialog"
    aria-modal="true"
    aria-label="Departamentos da UnB"
    tabindex="-1"
    onkeydown={handleKeydown}
  >
    <header class="flex items-center justify-between border-b border-white/10 px-5 py-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-wide text-green-300">Contatos</p>
        <h2 class="text-lg font-black">Departamentos</h2>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Fechar departamentos"
        class="text-blue-100 hover:bg-white/10 hover:text-white"
        onclick={closeDepartmentsSidebar}
      >
        <FiaqIcon name="i-lucide-x" class="h-5 w-5" />
      </Button>
    </header>

    <div class="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
      <div class="grid gap-3">
        {#each departamentos as departamento (departamento.slug)}
          <a
            href={`/contatos/${departamento.slug}`}
            class="group rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            onclick={closeDepartmentsSidebar}
          >
            <span class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-green-300">
              <FiaqIcon name={departamento.icon} class="h-5 w-5" />
            </span>
            <span class="block text-sm font-black">{departamento.nome}</span>
            <span class="mt-1 block text-xs font-semibold leading-5 text-blue-100">{departamento.descricao}</span>
          </a>
        {/each}
      </div>
    </div>
  </div>
{/if}
