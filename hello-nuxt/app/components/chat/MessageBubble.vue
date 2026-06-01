<template>
  <!-- User bubble -->
  <div v-if="message.role === 'user'" class="flex justify-end">
    <div class="bg-[#1a2e5a] text-white rounded-2xl rounded-br-sm px-5 py-3 max-w-[75%] text-sm leading-relaxed shadow-sm">
      {{ message.content }}
    </div>
  </div>

  <!-- Assistant bubble -->
  <div v-else class="flex justify-start gap-3">
    <div class="w-8 h-8 bg-[#1a2e5a] rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
      <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
        <rect x="5" y="7" width="14" height="10" rx="2.5" stroke="currentColor"/>
        <circle cx="9" cy="11" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="11" r="1.2" fill="currentColor" stroke="none"/>
        <path d="M9 14.5h6" stroke="currentColor" stroke-linecap="round"/>
        <path d="M12 7V4" stroke="currentColor" stroke-linecap="round"/>
        <circle cx="12" cy="3.5" r="0.8" fill="currentColor" stroke="none"/>
      </svg>
    </div>

    <div class="flex flex-col gap-2 max-w-[75%]">
      <!-- Message content -->
      <div class="bg-white border border-gray-200 text-[#1a2e5a] rounded-2xl rounded-bl-sm px-5 py-3 text-sm leading-relaxed shadow-sm">
        <span>{{ message.content }}</span>
        <span v-if="message.streaming" class="inline-block w-1.5 h-3.5 bg-[#1a2e5a] ml-0.5 align-middle animate-pulse" />
      </div>

      <!-- Sources -->
      <div v-if="message.sources && message.sources.length > 0" class="flex flex-wrap gap-2 px-1">
        <ChatSourceChip
          v-for="source in message.sources"
          :key="source.id"
          :source="source"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Message } from '~/composables/useFiaqChat'

defineProps<{ message: Message }>()
</script>
