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
    <div class="flex min-h-12 items-center gap-3 rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-5 py-3 shadow-sm">
      <span class="sr-only">
        Saruê preparando resposta.
      </span>
      <span
        aria-hidden="true"
        class="text-xs font-semibold text-slate-500"
      >
        Saruê pensando
      </span>
      <span
        aria-hidden="true"
        class="flex items-center gap-1.5"
      >
        <span
          class="dot"
          style="animation-delay: 0ms"
        />
        <span
          class="dot"
          style="animation-delay: 150ms"
        />
        <span
          class="dot"
          style="animation-delay: 300ms"
        />
      </span>
    </div>
  </div>
</template>

<style scoped>
.dot {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  background-color: #1a2e5a;
  border-radius: 9999px;
  animation: bounce 0.8s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
</style>
