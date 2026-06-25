<script lang="ts">
  import { onDestroy } from 'svelte'
  import FiaqIcon from '$lib/components/FiaqIcon.svelte'
  import Button from '$lib/components/ui/button.svelte'
  import type { Message, MessageDraft } from '$lib/stores/fiaq-chat'
  import { readConversationFile } from '$lib/utils/conversationExport'

  interface Props {
    messages: Message[]
    disabled: boolean
    onImport?: (messages: MessageDraft[]) => void
    onClear?: () => void
    class?: string
  }

  let { messages, disabled, onImport, onClear, class: className = '' }: Props = $props()
  let fileInput = $state<HTMLInputElement | null>(null)
  let status = $state('')
  let statusKind = $state<'info' | 'error'>('info')
  let busy = $state(false)
  let statusTimeout: number | null = null

  const canClear = $derived(messages.some(message => message.content.trim()))

  function showStatus(message: string, kind: 'info' | 'error' = 'info') {
    status = message
    statusKind = kind

    if (statusTimeout !== null) window.clearTimeout(statusTimeout)
    statusTimeout = window.setTimeout(() => {
      status = ''
      statusTimeout = null
    }, 2200)
  }

  async function handleImport(event: Event) {
    const input = event.target as HTMLInputElement
    if (busy) {
      input.value = ''
      return
    }

    status = ''
    const file = input.files?.[0]
    if (!file) return

    busy = true
    try {
      const importedMessages = await readConversationFile(file)
      const shouldReplace = !canClear || window.confirm('Substituir a conversa atual pela conversa importada?')
      if (!shouldReplace) return

      onImport?.(importedMessages)
      showStatus('Conversa importada.')
    } catch {
      showStatus('Arquivo inválido.', 'error')
    } finally {
      input.value = ''
      busy = false
    }
  }

  function handleClear() {
    if (!canClear) return
    const confirmed = window.confirm('Limpar a conversa atual?')
    if (!confirmed) return

    onClear?.()
    showStatus('Conversa limpa.')
  }

  onDestroy(() => {
    if (typeof window === 'undefined') return
    if (statusTimeout !== null) window.clearTimeout(statusTimeout)
  })
</script>

<div class={['flex min-h-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white/90 px-2 py-2 shadow-sm ring-1 ring-white/70 sm:min-h-16 sm:gap-3 sm:rounded-2xl sm:px-3 sm:py-2.5', className]}>
  <div class="flex min-w-0 flex-wrap items-center gap-2">
    <span class="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-600 sm:px-3.5 sm:text-sm" title="Mensagens">
      <FiaqIcon name="i-lucide-messages-square" class="h-4 w-4 text-[#1a2e5a]" />
      {messages.length}
    </span>

    <Button
      type="button"
      variant="outline"
      disabled={disabled || busy}
      title="Importar conversa temporária"
      class="inline-flex h-10 w-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#1a2e5a] shadow-sm transition-colors hover:border-[#1a2e5a] hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-3.5 sm:text-sm"
      onclick={() => fileInput?.click()}
    >
      <FiaqIcon name="i-lucide-upload" class="h-4 w-4" />
      <span class="sr-only sm:not-sr-only">Importar</span>
    </Button>

    <input
      bind:this={fileInput}
      type="file"
      name="conversation-import"
      aria-label="Importar conversa em JSON"
      class="hidden"
      accept="application/json,.json"
      onchange={handleImport}
    />
  </div>

  <div class="ml-auto flex min-w-0 items-center gap-2">
    {#if status}
      <span
        role="status"
        aria-live="polite"
        class={[
          'inline-flex max-w-[14rem] truncate rounded-full px-3 py-1 text-sm font-medium',
          statusKind === 'error'
            ? 'bg-red-50 text-red-700 ring-1 ring-red-100'
            : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
        ]}
      >
        {status}
      </span>
    {/if}

    <Button
      type="button"
      variant="outline"
      disabled={disabled || busy || !canClear}
      aria-label="Limpar conversa"
      title="Limpar conversa"
      class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-12"
      onclick={handleClear}
    >
      <FiaqIcon name="i-lucide-trash-2" class="h-5 w-5" />
    </Button>
  </div>
</div>
