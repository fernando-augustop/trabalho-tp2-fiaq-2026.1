<template>
  <div
    class="flex bg-slate-50"
    style="min-height: calc(100dvh - var(--nav-height, 80px))"
  >
    <div class="flex min-h-full w-full flex-col">
      <!-- Header -->
      <div class="bg-[#1a2e5a] px-5 py-5 sm:px-10">
        <div class="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div class="flex min-w-0 items-center gap-3">
            <img
              src="/sarueBot.png"
              alt="Assistente"
              class="h-18 w-18 shrink-0 object-contain"
            >
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
      <main class="flex min-h-0 flex-1 flex-col bg-slate-50">
        <div class="border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur sm:px-6">
          <ChatConversationActions
            class="mx-auto w-full max-w-7xl"
            :messages="messages"
            :disabled="loading"
            @import="replaceMessages"
            @clear="clearMessages"
          />
        </div>

        <ChatWindow
          class="flex-1"
          :messages="messages"
          :loading="loading"
          @suggest="sendMessage"
          @feedback="rateMessage"
        />

        <div class="sticky bottom-0 z-30 border-t border-slate-200 bg-gradient-to-t from-white via-white/95 to-white/75 px-4 pb-4 pt-3 backdrop-blur sm:px-6">
          <div class="mx-auto w-full max-w-7xl">
            <ChatComposer
              :disabled="loading"
              @send="sendMessage"
            />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useFiaqChat } from '~/composables/useFiaqChat'

const { messages, loading, sendMessage, rateMessage, replaceMessages, clearMessages } = useFiaqChat()

const route = useRoute()
onMounted(() => {
  const q = route.query.q
  if (typeof q === 'string' && q.trim()) sendMessage(q.trim())
})
</script>
