<template>
  <div
    class="flex justify-start gap-3"
    role="status"
    aria-live="polite"
  >
    <div class="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <img
        src="/sarue-avatar.png"
        alt=""
        class="h-12 w-12 object-contain"
      >
    </div>
    <span class="sr-only">Saruê verificando fontes para preparar a resposta.</span>
    <ChatResearchActivity :activities="message?.activity" />
  </div>
</template>

<script setup lang="ts">
import type { Message } from '~/composables/useFiaqChat'

defineProps<{
  message?: Message
}>()
</script>
