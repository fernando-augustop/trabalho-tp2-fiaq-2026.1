<template>
  <nav class="fiaq-nav sticky top-0 z-50 flex items-center justify-between gap-2 bg-[#1a2e5a] px-3 py-3 shrink-0 sm:gap-3 sm:px-10 sm:py-4">
    <FiaqBrand class="shrink-0" />

    <div class="fiaq-nav-links flex shrink-0 items-center gap-3 text-[13px] font-medium text-white sm:gap-8 sm:text-sm">
      <NuxtLink
        to="/"
        class="rounded-md px-1 py-1 transition-colors hover:text-green-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
      >
        Início
      </NuxtLink>

      <button
        type="button"
        class="m-0 cursor-pointer rounded-md border-0 bg-transparent px-1 py-1 font-medium text-white transition-colors hover:text-green-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
        @click="open"
      >
        Contatos
      </button>

      <NuxtLink
        to="/sobre"
        class="rounded-md px-1 py-1 transition-colors hover:text-green-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
      >
        Sobre
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useDepartmentsSidebar } from '~/composables/useDepartmentsSidebar'

const { open } = useDepartmentsSidebar()
</script>
