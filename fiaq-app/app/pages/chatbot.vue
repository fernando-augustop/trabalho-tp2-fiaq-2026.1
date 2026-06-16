<template>
  <div
    class="flex min-h-0 flex-col overflow-hidden bg-[#eef2f6]"
    style="height: calc(100dvh - var(--nav-height, 80px))"
  >
    <!-- Header -->
    <div class="shrink-0 bg-[#1a2e5a] px-5 py-5 sm:px-10">
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-green-300 ring-1 ring-white/10">
            <UIcon
              name="i-lucide-bot"
              class="h-6 w-6"
            />
          </span>
          <div class="min-w-0">
            <h1 class="truncate text-2xl font-extrabold text-white sm:text-3xl">
              Assistente Virtual
            </h1>
            <p class="mt-0.5 text-xs font-medium text-blue-100/80">
              {{ messages.length }} {{ messages.length === 1 ? 'mensagem' : 'mensagens' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat area -->
    <div class="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-3 overflow-hidden px-4 py-4 sm:py-5">
      <ChatConversationActions
        :messages="messages"
        :disabled="loading"
        @import="replaceMessages"
        @clear="clearMessages"
      />
      <ChatWindow
        :messages="messages"
        :loading="loading"
        @suggest="sendMessage"
      />
      <ChatComposer
        :disabled="loading"
        @send="sendMessage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useFiaqChat } from '~/composables/useFiaqChat'

const { messages, loading, sendMessage, replaceMessages, clearMessages } = useFiaqChat()

const route = useRoute()
onMounted(() => {
  const q = route.query.q
  if (typeof q === 'string' && q.trim()) sendMessage(q.trim())
})
</script>
