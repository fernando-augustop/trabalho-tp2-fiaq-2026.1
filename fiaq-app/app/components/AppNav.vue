<template>
  <nav class="fiaq-nav sticky top-0 z-50 bg-[#1a2e5a] px-6 sm:px-10 py-4 flex items-center justify-between shrink-0">
    <NuxtLink
      to="/"
      class="fiaq-logo text-white text-4xl sm:text-5xl font-black tracking-tight"
    >
      <span class="text-white">f</span><span class="fiaq-logo-accent text-green-700">IA</span><span class="text-white">q</span>
    </NuxtLink>
    <div class="fiaq-nav-links flex gap-6 sm:gap-8 text-white text-sm font-medium">
      <NuxtLink
        to="/"
        class="hover:text-green-400 transition-colors"
      >Início</NuxtLink>

      <button
        type="button"
        class="bg-transparent border-0 p-0 m-0 cursor-pointer font-medium hover:text-green-400 transition-colors"
        @click="open"
      >Contatos</button>

      <NuxtLink
        to="/sobre"
        class="hover:text-green-400 transition-colors"
      >Sobre</NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useDepartmentsSidebar } from '~/composables/useDepartmentsSidebar'

const { open } = useDepartmentsSidebar()
</script>
