<template>
  <main class="min-h-[calc(100vh-var(--nav-height))] bg-slate-50 px-4 py-8 text-[#1a2e5a] sm:px-6 lg:px-8">
    <section class="mx-auto flex max-w-7xl flex-col gap-6">
      <header class="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <UIcon
              name="i-lucide-shield-check"
              class="h-4 w-4"
            />
            Administração
          </p>
          <h1 class="text-2xl font-black tracking-normal sm:text-3xl">
            Curadoria do conhecimento
          </h1>
        </div>

        <button
          v-if="session"
          type="button"
          class="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:border-[#1a2e5a] hover:text-[#1a2e5a]"
          @click="logout"
        >
          <UIcon
            name="i-lucide-log-out"
            class="h-4 w-4"
          />
          Sair
        </button>
      </header>

      <div
        v-if="!authConfigured"
        class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800"
      >
        Configure `NUXT_PUBLIC_SUPABASE_URL` e `NUXT_PUBLIC_SUPABASE_ANON_KEY` para ativar o login.
      </div>

      <section
        v-else-if="inviteSession"
        class="max-w-xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 class="mb-4 text-lg font-black">
          Definir senha
        </h2>
        <form
          class="flex flex-col gap-3"
          @submit.prevent="completeInvite"
        >
          <input
            v-model="newPassword"
            type="password"
            minlength="8"
            required
            placeholder="Nova senha"
            class="h-12 rounded-lg border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-[#00a155] focus:ring-2 focus:ring-emerald-100"
          >
          <button
            type="submit"
            :disabled="busy"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#00a155] px-5 text-sm font-black text-[#082315] transition hover:bg-[#17b86a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UIcon
              name="i-lucide-key-round"
              class="h-4 w-4"
            />
            Salvar senha
          </button>
        </form>
      </section>

      <section
        v-else-if="!session"
        class="grid gap-5 lg:grid-cols-[minmax(0,28rem)_1fr]"
      >
        <form
          class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          @submit.prevent="login"
        >
          <h2 class="mb-4 text-lg font-black">
            Entrar
          </h2>
          <div class="flex flex-col gap-3">
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="email@unb.br"
              class="h-12 rounded-lg border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-[#00a155] focus:ring-2 focus:ring-emerald-100"
            >
            <input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="Senha"
              class="h-12 rounded-lg border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-[#00a155] focus:ring-2 focus:ring-emerald-100"
            >
            <button
              type="submit"
              :disabled="busy"
              class="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#00a155] px-5 text-sm font-black text-[#082315] transition hover:bg-[#17b86a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UIcon
                name="i-lucide-log-in"
                class="h-4 w-4"
              />
              Acessar
            </button>
          </div>
        </form>

        <div class="rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
          <p class="font-semibold">
            O acesso é liberado por convite do Supabase Auth e pela lista `admin_usuario`.
          </p>
        </div>
      </section>

      <section
        v-else-if="authorized"
        class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
      >
        <div class="flex flex-col gap-4">
          <div class="grid gap-3 sm:grid-cols-3">
            <button
              v-for="tab in tabs"
              :key="tab.status"
              type="button"
              class="flex items-center justify-between rounded-lg border px-4 py-3 text-left shadow-sm transition-colors"
              :class="status === tab.status
                ? 'border-[#00a155] bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200'"
              @click="setStatus(tab.status)"
            >
              <span class="text-sm font-black">{{ tab.label }}</span>
              <span class="rounded-full bg-white px-2.5 py-1 text-xs font-black shadow-sm">
                {{ totals[tab.countKey] ?? 0 }}
              </span>
            </button>
          </div>

          <div
            v-if="loading"
            class="rounded-lg border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500"
          >
            Carregando fila...
          </div>

          <div
            v-else-if="candidates.length === 0"
            class="rounded-lg border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500"
          >
            Nenhum item nesta fila.
          </div>

          <article
            v-for="candidate in candidates"
            :key="candidate.id"
            class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                #{{ candidate.id }}
              </span>
              <span
                class="rounded-full px-2.5 py-1 text-xs font-black"
                :class="candidate.motivo_busca_web === 'feedback_negativo'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-sky-50 text-sky-700'"
              >
                {{ candidate.motivo_busca_web === 'feedback_negativo' ? 'Complemento solicitado' : 'Busca automática' }}
              </span>
            </div>

            <h2 class="mb-3 text-lg font-black leading-snug">
              {{ candidate.pergunta }}
            </h2>
            <p class="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {{ candidate.resposta }}
            </p>

            <div
              v-if="candidate.fontes_usadas.length"
              class="mt-4 grid gap-2"
            >
              <a
                v-for="source in candidate.fontes_usadas"
                :key="sourceKey(source)"
                :href="sourceUrl(source)"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"
              >
                <UIcon
                  name="i-lucide-link"
                  class="h-4 w-4"
                />
                <span class="min-w-0 truncate">{{ sourceTitle(source) }}</span>
              </a>
            </div>

            <div
              v-if="candidate.status === 'pendente'"
              class="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4"
            >
              <textarea
                v-model="reviewNotes[candidate.id]"
                rows="2"
                placeholder="Observação opcional"
                class="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#00a155] focus:ring-2 focus:ring-emerald-100"
              />
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  :disabled="busy"
                  class="inline-flex h-10 items-center gap-2 rounded-lg bg-[#00a155] px-4 text-sm font-black text-[#082315] transition hover:bg-[#17b86a] disabled:cursor-not-allowed disabled:opacity-60"
                  @click="review(candidate.id, 'approve')"
                >
                  <UIcon
                    name="i-lucide-check"
                    class="h-4 w-4"
                  />
                  Aprovar
                </button>
                <button
                  type="button"
                  :disabled="busy"
                  class="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-red-200 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  @click="review(candidate.id, 'reject')"
                >
                  <UIcon
                    name="i-lucide-x"
                    class="h-4 w-4"
                  />
                  Rejeitar
                </button>
              </div>
            </div>
          </article>
        </div>

        <aside class="flex flex-col gap-4">
          <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="mb-3 text-base font-black">
              Administradores
            </h2>
            <p class="mb-4 text-sm font-semibold text-slate-500">
              {{ session.user.email }}
            </p>
            <form
              class="flex flex-col gap-3"
              @submit.prevent="sendInvite"
            >
              <input
                v-model="inviteEmail"
                type="email"
                required
                placeholder="novo-admin@unb.br"
                class="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#00a155] focus:ring-2 focus:ring-emerald-100"
              >
              <button
                type="submit"
                :disabled="busy"
                class="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-800 transition hover:border-[#00a155] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UIcon
                  name="i-lucide-mail-plus"
                  class="h-4 w-4"
                />
                Enviar convite
              </button>
            </form>
          </div>
        </aside>
      </section>

      <div
        v-else
        class="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700"
      >
        Seu usuário entrou no Supabase Auth, mas não está autorizado em `admin_usuario`.
      </div>

      <p
        v-if="notice"
        class="rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-600 shadow-sm"
      >
        {{ notice }}
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  clearAdminSession,
  loadAdminSession,
  readInviteSessionFromHash,
  refreshAdminSession,
  saveAdminSession,
  signInAdmin,
  signOutAdmin,
  updateAdminPassword,
  type AdminSession
} from '~/utils/supabaseAuth'

type CandidateStatus = 'pendente' | 'aprovada' | 'rejeitada'
type CandidateFilter = CandidateStatus | 'todas'
type ReviewAction = 'approve' | 'reject'

interface Candidate {
  id: number
  pergunta: string
  resposta: string
  fontes_usadas: unknown[]
  motivo_busca_web: 'fallback_automatico' | 'feedback_negativo'
  status: CandidateStatus
}

interface CandidateResponse {
  items: Candidate[]
  totals: Record<CandidateStatus, number>
}

interface AdminFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: Record<string, unknown>
  headers?: Record<string, string>
}

const runtimeConfig = useRuntimeConfig()
const authConfigured = computed(() => Boolean(runtimeConfig.public.supabaseUrl && runtimeConfig.public.supabaseAnonKey))
const session = ref<AdminSession | null>(null)
const inviteSession = ref<AdminSession | null>(null)
const authorized = ref(false)
const loading = ref(false)
const busy = ref(false)
const notice = ref('')
const email = ref('')
const password = ref('')
const newPassword = ref('')
const inviteEmail = ref('')
const status = ref<CandidateFilter>('pendente')
const candidates = ref<Candidate[]>([])
const totals = ref<Record<CandidateStatus, number>>({ pendente: 0, aprovada: 0, rejeitada: 0 })
const reviewNotes = ref<Record<number, string>>({})

const tabs: Array<{ label: string, status: CandidateFilter, countKey: CandidateStatus }> = [
  { label: 'Pendentes', status: 'pendente', countKey: 'pendente' },
  { label: 'Aprovadas', status: 'aprovada', countKey: 'aprovada' },
  { label: 'Rejeitadas', status: 'rejeitada', countKey: 'rejeitada' }
]

onMounted(async () => {
  if (!authConfigured.value) return

  const invited = readInviteSessionFromHash()
  if (invited) {
    inviteSession.value = invited
    return
  }

  const stored = loadAdminSession()
  if (stored) {
    session.value = stored
    await validateSession()
  }
})

async function adminFetch<T>(url: string, options: AdminFetchOptions = {}): Promise<T> {
  if (!session.value) throw new Error('AUTH_REQUIRED')

  const nextSession = await refreshAdminSession(session.value)
  session.value = nextSession

  return await $fetch(url, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      Authorization: `Bearer ${nextSession.accessToken}`
    }
  }) as T
}

async function validateSession() {
  if (!session.value) return

  try {
    await adminFetch('/api/admin/me')
    authorized.value = true
    await fetchCandidates()
  } catch (error) {
    authorized.value = false
    notice.value = error instanceof Error ? error.message : 'Acesso não autorizado.'
  }
}

async function login() {
  busy.value = true
  notice.value = ''

  try {
    session.value = await signInAdmin(email.value, password.value)
    await validateSession()
  } catch (error) {
    clearAdminSession()
    session.value = null
    notice.value = error instanceof Error ? error.message : 'Falha no login.'
  } finally {
    busy.value = false
  }
}

async function completeInvite() {
  if (!inviteSession.value) return
  busy.value = true
  notice.value = ''

  try {
    await updateAdminPassword(inviteSession.value, newPassword.value)
    saveAdminSession(inviteSession.value)
    session.value = inviteSession.value
    inviteSession.value = null
    await validateSession()
  } catch (error) {
    notice.value = error instanceof Error ? error.message : 'Não foi possível definir a senha.'
  } finally {
    busy.value = false
  }
}

async function logout() {
  await signOutAdmin(session.value)
  session.value = null
  inviteSession.value = null
  authorized.value = false
  candidates.value = []
}

async function fetchCandidates() {
  if (!session.value || !authorized.value) return
  loading.value = true

  try {
    const response = await adminFetch<CandidateResponse>(`/api/admin/candidates?status=${status.value}`)
    candidates.value = response.items
    totals.value = response.totals
  } finally {
    loading.value = false
  }
}

async function setStatus(nextStatus: CandidateFilter) {
  status.value = nextStatus
  await fetchCandidates()
}

async function review(id: number, action: ReviewAction) {
  busy.value = true
  notice.value = ''

  try {
    await adminFetch(`/api/admin/candidates/${id}`, {
      method: 'PATCH',
      body: {
        action,
        observation: reviewNotes.value[id] || undefined
      }
    })
    notice.value = action === 'approve'
      ? 'Resposta aprovada e adicionada ao RAG.'
      : 'Resposta rejeitada.'
    await fetchCandidates()
  } catch (error) {
    notice.value = error instanceof Error ? error.message : 'Não foi possível revisar.'
  } finally {
    busy.value = false
  }
}

async function sendInvite() {
  busy.value = true
  notice.value = ''

  try {
    await adminFetch('/api/admin/invites', {
      method: 'POST',
      body: { email: inviteEmail.value }
    })
    notice.value = 'Convite enviado.'
    inviteEmail.value = ''
  } catch (error) {
    notice.value = error instanceof Error ? error.message : 'Não foi possível enviar o convite.'
  } finally {
    busy.value = false
  }
}

function sourceTitle(source: unknown): string {
  if (!source || typeof source !== 'object') return 'Fonte web'
  const item = source as Record<string, unknown>
  return String(item.titulo || item.title || item.url || 'Fonte web')
}

function sourceUrl(source: unknown): string {
  if (!source || typeof source !== 'object') return '#'
  return String((source as Record<string, unknown>).url || '#')
}

function sourceKey(source: unknown): string {
  return `${sourceTitle(source)}:${sourceUrl(source)}`
}
</script>
