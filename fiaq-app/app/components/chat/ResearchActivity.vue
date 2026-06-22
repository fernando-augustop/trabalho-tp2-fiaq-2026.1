<template>
  <div :class="wrapperClass">
    <div class="flex items-start gap-3">
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#00a155] ring-1 ring-emerald-100">
        <UIcon
          name="i-lucide-search-check"
          class="h-4 w-4"
        />
      </span>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-sm font-extrabold text-[#1a2e5a]">
            Saruê está verificando fontes
          </p>
          <span
            v-if="activeActivity"
            class="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
            {{ activeActivity.label }}
          </span>
        </div>
        <p
          v-if="activeActivity?.detail && !compact"
          class="mt-1 text-xs font-medium leading-5 text-slate-500"
        >
          {{ activeActivity.detail }}
        </p>
      </div>
    </div>

    <div
      class="mt-3 grid gap-2"
      :class="compact ? 'text-xs' : 'text-sm'"
    >
      <div
        v-for="activity in visibleActivities"
        :key="activity.id"
        class="rounded-xl border px-3 py-2.5"
        :class="activityRowClass(activity)"
      >
        <div class="flex min-w-0 items-start gap-2.5">
          <span
            class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
            :class="activityIconClass(activity)"
          >
            <UIcon
              :name="activityIcon(activity)"
              class="h-3.5 w-3.5"
            />
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p class="font-bold leading-5 text-[#1a2e5a]">
                {{ activity.label }}
              </p>
              <span
                v-if="activity.status === 'active'"
                class="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-emerald-700"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
                em andamento
              </span>
            </div>
            <p
              v-if="activity.detail"
              class="mt-0.5 leading-5 text-slate-500"
            >
              {{ activity.detail }}
            </p>

            <div
              v-if="activity.sources?.length"
              class="mt-2 flex flex-wrap gap-1.5"
            >
              <span
                v-for="source in activity.sources"
                :key="source.id"
                class="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm"
              >
                <UIcon
                  :name="source.kind === 'web' ? 'i-lucide-globe-2' : 'i-lucide-book-open'"
                  class="h-3.5 w-3.5 shrink-0 text-[#00a155]"
                />
                <span
                  v-if="source.kind === 'web'"
                  class="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700"
                >
                  web
                </span>
                <span
                  v-else
                  class="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#1a2e5a]"
                >
                  RAG
                </span>
                <span class="truncate">{{ sourceTitle(source) }}</span>
                <span
                  v-if="sourceHost(source.url)"
                  class="hidden shrink-0 text-slate-400 sm:inline"
                >
                  {{ sourceHost(source.url) }}
                </span>
              </span>
            </div>

            <div
              v-else-if="activity.domains?.length"
              class="mt-2 flex flex-wrap gap-1.5"
            >
              <span
                v-for="domain in activity.domains"
                :key="domain"
                class="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100"
              >
                <UIcon
                  name="i-lucide-globe-2"
                  class="h-3 w-3"
                />
                {{ domain }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SearchActivity, Source } from '~/composables/useFiaqChat'

const props = withDefaults(defineProps<{
  activities?: SearchActivity[]
  compact?: boolean
}>(), {
  compact: false
})

const fallbackActivities = computed<SearchActivity[]>(() => [
  {
    id: 'preparing',
    kind: 'rag',
    status: 'active',
    label: 'Abrindo a base do fIAq',
    detail: 'Consultando o RAG local e as fontes oficiais disponíveis.'
  }
])

const visibleActivities = computed(() => {
  return props.activities?.length ? props.activities : fallbackActivities.value
})

const activeActivity = computed(() => {
  return visibleActivities.value.find(activity => activity.status === 'active')
})

const wrapperClass = computed(() => [
  'border border-slate-200 text-left leading-normal shadow-sm',
  props.compact
    ? 'mb-4 rounded-2xl bg-emerald-50/40 p-3'
    : 'w-full max-w-[min(56rem,92vw)] rounded-2xl rounded-bl-sm bg-white px-4 py-4'
])

function activityIcon(activity: SearchActivity): string {
  if (activity.status === 'done') return 'i-lucide-check'
  if (activity.status === 'skipped') return 'i-lucide-circle-minus'
  if (activity.status === 'error') return 'i-lucide-circle-alert'
  if (activity.kind === 'web') return 'i-lucide-globe-2'
  if (activity.kind === 'rag') return 'i-lucide-database'
  return 'i-lucide-sparkles'
}

function activityRowClass(activity: SearchActivity): string {
  if (activity.status === 'active') return 'border-emerald-200 bg-emerald-50/60'
  if (activity.status === 'done') return 'border-slate-200 bg-white'
  if (activity.status === 'error') return 'border-amber-200 bg-amber-50/70'
  return 'border-slate-200 bg-slate-50/70'
}

function activityIconClass(activity: SearchActivity): string {
  if (activity.status === 'active') return 'bg-emerald-100 text-emerald-700'
  if (activity.status === 'done') return 'bg-emerald-50 text-emerald-700'
  if (activity.status === 'error') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-500'
}

function sourceTitle(source: Source): string {
  return (source.titulo || source.url || 'Fonte oficial').replace(/\s+/g, ' ').trim()
}

function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
</script>
