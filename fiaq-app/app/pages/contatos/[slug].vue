<template>
  <div class="flex-1 bg-[#f4f4f4]">
    <div class="bg-[#1a2e5a] px-6 pt-8 pb-12 sm:px-10">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-blue-200 transition-colors hover:text-green-400"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="h-4 w-4"
        />
        Voltar para o início
      </NuxtLink>

      <div class="mx-auto mt-4 max-w-2xl text-center">
        <div
          v-if="departamento"
          class="mb-3 inline-flex items-center gap-1.5 rounded-full border border-green-400/30 bg-green-400/15 px-3.5 py-1.5 text-[13px] font-semibold text-green-300"
        >
          <UIcon
            :name="departamento.icon"
            class="h-3.5 w-3.5"
          />
          {{ departamento.badge }}
        </div>

        <h1 class="text-3xl font-extrabold text-white sm:text-4xl">
          Contatos
        </h1>

        <p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-blue-200">
          {{ departamento?.descricao ?? 'Departamento não encontrado.' }}
        </p>
      </div>
    </div>

    <div class="mx-auto max-w-3xl px-5 py-8 sm:px-6">
      <div
        v-if="!departamento"
        class="py-16 text-center"
      >
        <p class="text-lg font-bold text-[#1a2e5a]">
          Departamento não encontrado.
        </p>
        <NuxtLink
          to="/"
          class="mt-2 inline-block text-sm text-[#1a2e5a] hover:underline"
        >
          Voltar para o início
        </NuxtLink>
      </div>

      <template v-else>
        <div class="mb-6 overflow-hidden rounded-2xl bg-[#1a2e5a]">
          <div class="flex items-start gap-3.5 px-6 py-5">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-green-400/15 text-green-300">
              <UIcon
                name="i-lucide-map-pin"
                class="h-5 w-5"
              />
            </span>
            <div>
              <p class="mb-1 text-sm font-bold text-white">
                Endereço do departamento
              </p>
              <p class="text-[13px] leading-relaxed text-blue-100">
                {{ departamento.endereco }}
              </p>
            </div>
          </div>

          <iframe
            v-if="departamento.mapsUrl"
            :src="departamento.mapsUrl"
            class="h-64 w-full border-0 sm:h-72"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            :title="`Mapa de ${departamento.nome}`"
          />
        </div>

        <p class="mb-4 text-[15px] font-bold text-[#1a2e5a]">
          Contatos principais
        </p>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div
            v-for="card in departamento.cards"
            :key="card.nome"
            class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div class="flex items-center gap-3 bg-[#1a2e5a] px-5 py-4">
              <span class="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-green-400/40 bg-green-400/20 text-green-300">
                <UIcon
                  :name="card.icon"
                  class="h-[18px] w-[18px]"
                />
              </span>
              <div class="min-w-0">
                <p class="text-[15px] font-bold text-white">
                  {{ card.nome }}
                </p>
                <p class="mt-0.5 text-xs text-blue-100">
                  {{ card.local }}
                </p>
              </div>
            </div>

            <div class="px-5 py-4">
              <div
                v-for="(item, idx) in card.itens"
                :key="item.label"
                class="flex items-start gap-2.5 py-2 text-[13px]"
                :class="idx < card.itens.length - 1 ? 'border-b border-slate-100' : ''"
              >
                <span class="mt-px flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1a2e5a]">
                  <UIcon
                    :name="item.icon"
                    class="h-[15px] w-[15px]"
                  />
                </span>
                <div class="min-w-0">
                  <p class="text-[11px] leading-none text-slate-400">
                    {{ item.label }}
                  </p>
                  <component
                    :is="item.href ? 'a' : 'span'"
                    :href="item.href ?? undefined"
                    :target="item.external ? '_blank' : undefined"
                    :rel="item.external ? 'noopener noreferrer' : undefined"
                    :class="item.href ? 'mt-0.5 block break-words text-[13px] leading-relaxed text-blue-700 hover:underline' : 'mt-0.5 block break-words text-[13px] leading-relaxed text-slate-800'"
                  >
                    {{ item.value }}
                  </component>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { findDepartamento } from '~/utils/departamentos'

const route = useRoute()
const slug = computed(() => {
  const param = route.params.slug
  const value = Array.isArray(param) ? param[0] : param

  return value ?? ''
})
const departamento = computed(() => findDepartamento(slug.value))

useSeoMeta({
  title: () => `Contatos — ${departamento.value?.nome ?? 'Departamento não encontrado'} — fIAq`,
  description: () => departamento.value?.descricao ?? 'Departamento não encontrado.'
})
</script>
