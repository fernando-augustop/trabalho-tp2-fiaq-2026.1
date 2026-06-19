<template>
  <div class="flex-1 bg-[#f0f2f7]">
    <div class="bg-[#1a2744] px-6 pt-8 pb-10 text-center sm:px-10">
      <NuxtLink
        to="/"
        class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-200 transition-colors hover:text-green-400"
      >
        <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
        Voltar para o início
      </NuxtLink>

      <div
        v-if="departamento"
        class="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#22c55e]/35 bg-[#22c55e]/15 px-3.5 py-1.5 text-[13px] text-[#22c55e]"
      >
        <UIcon :name="departamento.icon" class="h-3.5 w-3.5" />
        {{ departamento.badge }}
      </div>

      <h1 class="text-xl font-medium text-white sm:text-2xl">
        Contatos
      </h1>

      <p class="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-400">
        {{ departamento?.descricao ?? 'Departamento não encontrado.' }}
      </p>
    </div>

    <div class="mx-auto max-w-3xl px-5 py-6">
      <div
        v-if="!departamento"
        class="py-16 text-center"
      >
        <p class="text-lg font-bold text-[#1a2744]">
          Departamento não encontrado.
        </p>
        <NuxtLink
          to="/"
          class="mt-2 inline-block text-sm text-[#1a2744] hover:underline"
        >
          Voltar para o início
        </NuxtLink>
      </div>

      <template v-else>
        <div class="mb-6 flex items-start gap-3.5 rounded-2xl bg-[#1a2744] px-6 py-5">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#22c55e]/15 text-[#22c55e]">
            <UIcon name="i-lucide-map-pin" class="h-5 w-5" />
          </span>
          <div>
            <p class="mb-1 text-sm font-medium text-white">
              Endereço do departamento
            </p>
            <p class="text-[13px] leading-relaxed text-slate-400">
              {{ departamento.endereco }}
            </p>
          </div>
        </div>

        <p class="mb-4 text-[15px] font-medium text-[#1a2744]">
          Contatos principais
        </p>

        <div class="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-3">
          <div
            v-for="card in departamento.cards"
            :key="card.nome"
            class="overflow-hidden rounded-[14px] border-[0.5px] border-[#dde1ec] bg-white"
          >
            <div class="flex items-center gap-3 bg-[#1a2744] px-5 py-4">
              <span class="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#22c55e]/40 bg-[#22c55e]/20 text-[#22c55e]">
                <UIcon :name="card.icon" class="h-[18px] w-[18px]" />
              </span>
              <div>
                <p class="text-[15px] font-medium text-white">
                  {{ card.nome }}
                </p>
                <p class="mt-0.5 text-xs text-slate-400">
                  {{ card.local }}
                </p>
              </div>
            </div>

            <div class="px-5 py-4">
              <div
                v-for="(item, idx) in card.itens"
                :key="item.label"
                class="flex items-start gap-2.5 py-2 text-[13px]"
                :class="idx < card.itens.length - 1 ? 'border-b-[0.5px] border-[#eef0f5]' : ''"
              >
                <span class="mt-px flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-[#eef6ff] text-[#1a2744]">
                  <UIcon :name="item.icon" class="h-[15px] w-[15px]" />
                </span>
                <div>
                  <p class="text-[11px] leading-none text-slate-400">
                    {{ item.label }}
                  </p>
                  <component
                    :is="item.href ? 'a' : 'span'"
                    :href="item.href ?? undefined"
                    :target="item.external ? '_blank' : undefined"
                    :rel="item.external ? 'noopener noreferrer' : undefined"
                    :class="item.href ? 'mt-0.5 text-[13px] leading-relaxed text-[#185FA5] hover:underline' : 'mt-0.5 text-[13px] leading-relaxed text-slate-800'"
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
const slug = computed(() => String(route.params.slug))
const departamento = computed(() => findDepartamento(slug.value))

useSeoMeta({
  title: () => `Contatos — ${departamento.value?.nome ?? 'Departamento não encontrado'} — fIAq`,
  description: () => departamento.value?.descricao ?? 'Departamento não encontrado.'
})
</script>
