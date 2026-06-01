<template>
  <div class="min-h-screen bg-[#f4f4f4] font-sans flex flex-col">

    <!-- Navbar -->
    <nav class="bg-[#1a2e5a] px-10 py-4 flex items-center justify-between shrink-0">
      <NuxtLink to="/" class="text-white text-5xl font-black tracking-tight">
        <span class="text-white">f</span><span class="text-green-700">IA</span><span class="text-white">q</span>
      </NuxtLink>
      <div class="flex gap-8 text-white text-sm font-medium">
        <a href="#" class="hover:text-green-400 transition-colors">FAQ</a>
        <NuxtLink to="/" class="hover:text-green-400 transition-colors">Categorias</NuxtLink>
        <a href="#" class="hover:text-green-400 transition-colors">Contato</a>
      </div>
    </nav>

    <!-- Header -->
    <div class="bg-[#1a2e5a] px-10 pt-4 pb-6 text-center shrink-0">
      <div class="flex items-center justify-center gap-3">
        <svg class="w-7 h-7 text-green-400" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
          <rect x="5" y="7" width="14" height="10" rx="2.5" stroke="currentColor"/>
          <circle cx="9" cy="11" r="1.2" fill="currentColor" stroke="none"/>
          <circle cx="15" cy="11" r="1.2" fill="currentColor" stroke="none"/>
          <path d="M9 14.5h6" stroke="currentColor" stroke-linecap="round"/>
          <path d="M12 7V4" stroke="currentColor" stroke-linecap="round"/>
          <circle cx="12" cy="3.5" r="0.8" fill="currentColor" stroke="none"/>
          <path d="M5 10.5H3.5M18.5 10.5H20" stroke="currentColor" stroke-linecap="round"/>
        </svg>
        <h1 class="text-3xl font-extrabold text-white">Assistente Virtual</h1>
      </div>
    </div>

    <div class="h-px bg-gray-300 mx-10 shrink-0" />

    <!-- Chat area -->
    <div class="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-6 gap-4 overflow-hidden">
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
import { useFiaqChat } from '~/composables/useFiaqChat'

const { messages, loading, sendMessage } = useFiaqChat()
</script>
