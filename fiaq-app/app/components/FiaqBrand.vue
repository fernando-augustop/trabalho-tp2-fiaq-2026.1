<template>
  <component
    :is="link ? 'NuxtLink' : 'span'"
    :to="link ? '/' : undefined"
    :aria-label="link ? 'fIAq — ir para o início' : undefined"
    class="fiaq-brand"
    :data-size="size"
  >
    <span class="fiaq-brand-badge">
      <img
        src="/sarue-avatar.png"
        alt=""
        class="fiaq-brand-sarue"
        width="48"
        height="48"
      >
    </span>
    <span class="fiaq-brand-word">
      <span>f</span><span class="fiaq-brand-accent">IA</span><span>q</span>
    </span>
  </component>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  /** Renderiza como link para a home (nav). Quando falso, vira marca estática (cabeçalhos). */
  link?: boolean
  size?: 'sm' | 'md'
}>(), {
  link: true,
  size: 'md'
})
</script>

<style scoped>
.fiaq-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  color: #fff;
  line-height: 1;
}

.fiaq-brand-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.7rem;
  background: #fff;
  box-shadow: 0 4px 12px rgba(4, 12, 30, 0.25);
  overflow: hidden;
}

.fiaq-brand-sarue {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.15rem;
}

.fiaq-brand-word {
  font-weight: 900;
  letter-spacing: -0.01em;
  font-size: 1.55rem;
  white-space: nowrap;
}

.fiaq-brand-accent {
  color: var(--fiaq-green-bright, #00dc82);
}

/* Link: leve realce no hover/foco sem deslocar layout. */
a.fiaq-brand {
  border-radius: 0.85rem;
  transition: opacity 0.2s ease;
}
a.fiaq-brand:hover { opacity: 0.92; }
a.fiaq-brand:focus-visible {
  outline: 2px solid var(--fiaq-green-bright, #00dc82);
  outline-offset: 3px;
}

.fiaq-brand[data-size="sm"] .fiaq-brand-badge { width: 2rem; height: 2rem; border-radius: 0.6rem; }
.fiaq-brand[data-size="sm"] .fiaq-brand-word { font-size: 1.35rem; }

@media (min-width: 640px) {
  .fiaq-brand { gap: 0.65rem; }
  .fiaq-brand-badge { width: 2.75rem; height: 2.75rem; border-radius: 0.85rem; }
  .fiaq-brand-word { font-size: 2.5rem; }
  .fiaq-brand[data-size="sm"] .fiaq-brand-badge { width: 2.4rem; height: 2.4rem; }
  .fiaq-brand[data-size="sm"] .fiaq-brand-word { font-size: 1.9rem; }
}
</style>
