<template>
  <div class="flex justify-start gap-3">
    <div class="w-8 h-8 bg-[#1a2e5a] rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
      <svg
        class="w-4 h-4 text-green-400"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        viewBox="0 0 24 24"
      >
        <rect
          x="5"
          y="7"
          width="14"
          height="10"
          rx="2.5"
          stroke="currentColor"
        />
        <circle
          cx="9"
          cy="11"
          r="1.2"
          fill="currentColor"
          stroke="none"
        />
        <circle
          cx="15"
          cy="11"
          r="1.2"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="M9 14.5h6"
          stroke="currentColor"
          stroke-linecap="round"
        />
        <path
          d="M12 7V4"
          stroke="currentColor"
          stroke-linecap="round"
        />
        <circle
          cx="12"
          cy="3.5"
          r="0.8"
          fill="currentColor"
          stroke="none"
        />
      </svg>
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
