<template>
  <div
    class="flex flex-col overflow-hidden"
    style="height: calc(100vh - var(--nav-height, 64px))"
  >
    <!-- Header -->
    <div class="bg-[#1a2e5a] px-10 pt-4 pb-6 text-center shrink-0">
      <div class="flex items-center justify-center gap-3">
        <UIcon
          name="i-lucide-bot"
          class="w-7 h-7 text-green-400"
        />
        <h1 class="text-3xl font-extrabold text-white">
          Assistente Virtual
        </h1>
      </div>
    </div>
    <div class="h-px bg-gray-300 mx-10 shrink-0" />
    <!-- Chat area -->
    <div class="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-6 gap-4 overflow-hidden">
      <ChatConversationActions
        :messages="messages"
        :disabled="loading"
        @import="replaceMessages"
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

const { messages, loading, sendMessage, replaceMessages } = useFiaqChat()

const route = useRoute()
onMounted(() => {
  const q = route.query.q
  if (typeof q === 'string' && q.trim()) sendMessage(q.trim())
})
</script>
