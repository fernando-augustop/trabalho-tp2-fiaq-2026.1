<template>
  <Teleport to="body">
    <Transition name="fiaq-backdrop">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40 bg-slate-900/50"
        @click="close"
      />
    </Transition>

    <Transition name="fiaq-panel">
      <aside
        v-if="isOpen"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Departamentos da UnB"
      >
        <div class="flex items-center justify-between gap-3 bg-[#1a2e5a] px-5 py-4">
          <div class="flex items-center gap-2.5 text-white">
            <UIcon
              name="i-lucide-building-2"
              class="h-5 w-5 text-green-300"
            />
            <h2 class="text-base font-bold">
              Departamentos
            </h2>
          </div>
          <button
            type="button"
            title="Fechar"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-blue-200 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            @click="close"
          >
            <UIcon
              name="i-lucide-x"
              class="h-5 w-5"
            />
          </button>
        </div>

        <p class="px-5 pt-4 text-xs text-gray-500">
          Selecione um departamento para ver os contatos oficiais.
        </p>

        <div class="flex flex-col gap-2 overflow-y-auto px-3 py-4">
          <NuxtLink
            v-for="dep in departamentos"
            :key="dep.slug"
            :to="`/contatos/${dep.slug}`"
            class="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1a2e5a] hover:bg-blue-50 hover:shadow-sm"
            @click="close"
          >
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1a2e5a] text-green-300">
              <UIcon
                :name="dep.icon"
                class="h-5 w-5"
              />
            </span>
            <span class="min-w-0">
              <span class="block truncate text-sm font-bold text-[#1a2e5a]">{{ dep.nome }}</span>
              <span class="text-xs text-gray-400">{{ dep.sigla }}</span>
            </span>
            <UIcon
              name="i-lucide-chevron-right"
              class="ml-auto h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[#1a2e5a]"
            />
          </NuxtLink>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { departamentos } from '~/utils/departamentos'
import { useDepartmentsSidebar } from '~/composables/useDepartmentsSidebar'

const { isOpen, close } = useDepartmentsSidebar()
let bodyScrollLocks = 0
let previousBodyOverflow = ''

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

function lockBodyScroll() {
  if (bodyScrollLocks === 0) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  bodyScrollLocks++
}

function unlockBodyScroll() {
  if (bodyScrollLocks === 0) return
  bodyScrollLocks--

  if (bodyScrollLocks === 0) {
    document.body.style.overflow = previousBodyOverflow
    previousBodyOverflow = ''
  }
}

watch(isOpen, (open) => {
  if (!import.meta.client) return

  if (open) {
    lockBodyScroll()
    window.addEventListener('keydown', handleKeydown)
  } else {
    unlockBodyScroll()
    window.removeEventListener('keydown', handleKeydown)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (!import.meta.client) return
  if (isOpen.value) unlockBodyScroll()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.fiaq-backdrop-enter-active,
.fiaq-backdrop-leave-active { transition: opacity 0.2s ease; }
.fiaq-backdrop-enter-from,
.fiaq-backdrop-leave-to { opacity: 0; }

.fiaq-panel-enter-active,
.fiaq-panel-leave-active { transition: transform 0.25s ease; }
.fiaq-panel-enter-from,
.fiaq-panel-leave-to { transform: translateX(100%); }
</style>
