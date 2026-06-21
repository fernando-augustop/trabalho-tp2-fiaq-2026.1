
<template>
  <div class="flex justify-start gap-3">
    <div class="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
      <img
        src="/content.png"
        alt="Assistente"
        class="h-8 w-8 object-cover"
      >
    </div>
    <div class="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
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
