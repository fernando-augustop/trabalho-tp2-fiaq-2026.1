<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte'
  import FiaqIcon from '$lib/components/FiaqIcon.svelte'
  import Button from '$lib/components/ui/button.svelte'
  import MessageBubble from '$lib/components/chat/MessageBubble.svelte'
  import TypingIndicator from '$lib/components/chat/TypingIndicator.svelte'
  import type { Message } from '$lib/stores/fiaq-chat'

  interface Props {
    messages: Message[]
    loading: boolean
    composerFocused: boolean
    onSuggest?: (text: string) => void
    onFeedback?: (messageId: number, rating: 'helpful' | 'unhelpful') => void
    class?: string
  }

  let { messages, loading, composerFocused, onSuggest, onFeedback, class: className = '' }: Props = $props()
  let messagesEl = $state<HTMLElement | null>(null)
  let bottomSentinel = $state<HTMLElement | null>(null)
  let isNearBottom = $state(true)
  let shouldFollowStream = $state(true)
  let scrollFrame: number | null = null
  let programmaticScrollUntil = 0

  const typingMessage = $derived.by(() => {
    const last = messages[messages.length - 1]
    return last && last.role === 'assistant' && last.streaming && !last.content?.trim()
      ? last
      : null
  })
  const showJumpToBottom = $derived(messages.length > 0 && !isNearBottom)

  const suggestions = [
    'Quais são as etapas da matrícula?',
    'Como funciona o estágio obrigatório?',
    'Como encontro um orientador de Projeto Final?',
    'Posso migrar de estrutura curricular?'
  ]

  function measureBottomDistance() {
    if (typeof window === 'undefined') return 0
    const doc = document.documentElement
    return doc.scrollHeight - window.scrollY - window.innerHeight
  }

  function handleScroll() {
    const nearBottom = measureBottomDistance() < 320
    isNearBottom = nearBottom

    if (nearBottom) {
      shouldFollowStream = true
      return
    }

    if (Date.now() > programmaticScrollUntil) {
      shouldFollowStream = false
    }
  }

  async function scrollToBottom(behavior: ScrollBehavior = 'auto') {
    await tick()
    programmaticScrollUntil = Date.now() + 280

    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior
      })
    } else {
      ;(bottomSentinel ?? messagesEl)?.scrollIntoView({ block: 'end', behavior })
    }

    isNearBottom = true
  }

  function queueFollowScroll() {
    if (typeof window === 'undefined' || !shouldFollowStream || scrollFrame !== null) return

    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = null
      if (shouldFollowStream) void scrollToBottom('auto')
    })
  }

  onMount(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    handleScroll()
    if (loading) void scrollToBottom('auto')
  })

  onDestroy(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleScroll)
    if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame)
  })

  $effect(() => {
    const last = messages[messages.length - 1]
    if (!last) return

    if (last.role === 'user') {
      shouldFollowStream = true
      void scrollToBottom('smooth')
      return
    }

    if (last.streaming && shouldFollowStream) {
      void scrollToBottom(messages.length > 1 ? 'smooth' : 'auto')
    }
  })

  $effect(() => {
    if (loading && isNearBottom) {
      shouldFollowStream = true
      void scrollToBottom('smooth')
    }
  })

  $effect(() => {
    const lastContent = messages[messages.length - 1]?.content
    if (lastContent !== undefined) queueFollowScroll()
  })
</script>

<div class={['relative', className]}>
  <div
    bind:this={messagesEl}
    class="fiaq-chat-stream mx-auto flex min-h-[calc(100dvh-14rem)] w-full max-w-5xl flex-col gap-4 px-3 pb-[calc(var(--chat-composer-height,7rem)+6rem)] pt-4 sm:min-h-[calc(100dvh-18rem)] sm:gap-6 sm:px-6 sm:pb-44 sm:pt-6 lg:px-8"
  >
    {#if messages.length === 0}
      <div
        class={[
          'flex flex-1 flex-col items-center gap-4 text-center transition-[padding,justify-content] duration-200',
          composerFocused
            ? 'min-h-[calc(100dvh-var(--chat-composer-height,7rem)-17rem)] justify-end pb-3 pt-6 sm:min-h-0 sm:justify-center sm:py-12'
            : 'justify-center py-10 sm:py-12'
        ]}
      >
        {#if !composerFocused}
          <div class="flex items-center justify-center">
            <img src="/sarueBot.png" alt="Saruê, assistente virtual do fIAq" width="80" height="80" class="h-16 w-16 object-contain sm:h-20 sm:w-20" />
          </div>
          <div>
            <p class="text-lg font-bold text-[#1a2e5a]">Olá! Como posso ajudar?</p>
            <p class="mt-1 text-sm text-gray-500">Pergunte sobre matrícula, TCC, estágio, extensão e muito mais.</p>
          </div>
          <div class="mt-2 flex max-w-2xl flex-wrap justify-center gap-2">
            {#each suggestions as suggestion (suggestion)}
              <Button
                class="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#1a2e5a] shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#1a2e5a] hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 sm:px-4 sm:text-sm"
                onclick={() => onSuggest?.(suggestion)}
              >
                {suggestion}
              </Button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    {#each messages as msg (msg.id)}
      <MessageBubble
        message={msg}
        allMessages={messages}
        feedbackDisabled={loading}
        onFeedback={onFeedback}
      />
    {/each}

    {#if typingMessage}
      <TypingIndicator message={typingMessage} />
    {/if}
    <div bind:this={bottomSentinel} class="h-1" aria-hidden="true"></div>
  </div>

  {#if showJumpToBottom}
    <Button
      type="button"
      aria-label="Ir para o fim da conversa"
      title="Ir para o fim da conversa"
      class="fixed bottom-[calc(var(--chat-composer-height,5.75rem)+0.75rem)] right-3 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#1a2e5a] text-white shadow-lg ring-1 ring-white/30 transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-[#243d75] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 sm:bottom-32 sm:left-1/2 sm:right-auto sm:h-auto sm:w-auto sm:-translate-x-1/2 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm sm:font-bold"
      onclick={() => void scrollToBottom('smooth')}
    >
      <FiaqIcon name="i-lucide-arrow-down" class="h-4 w-4" />
      <span class="sr-only sm:not-sr-only">Última resposta</span>
    </Button>
  {/if}
</div>
