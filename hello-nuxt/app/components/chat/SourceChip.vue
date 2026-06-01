<template>
  <a
    :href="source.url"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-[#1a2e5a] rounded-full px-3 py-1 text-xs font-medium hover:bg-blue-100 hover:border-[#1a2e5a] transition-all duration-200"
  >
    <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    {{ source.titulo }}
  </a>
</template>

<script setup lang="ts">
import type { Source } from '~/composables/useFiaqChat'

defineProps<{ source: Source }>()
</script>
