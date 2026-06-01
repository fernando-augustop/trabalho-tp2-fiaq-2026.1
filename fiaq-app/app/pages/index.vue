<template>
  <div class="min-h-screen bg-[#f4f4f4] font-sans">

    <nav class="bg-[#1a2e5a] px-10 py-4 flex items-center justify-between">
      <div class="text-white text-5xl font-black tracking-tight">
        <span class="text-white">f</span><span class="text-green-700">IA</span><span class="text-white">q</span>
      </div>
      <div class="flex gap-8 text-white text-sm font-medium">
        <a href="#" class="hover:text-green-400 transition-colors">FAQ</a>
        <a href="/academica" class="hover:text-green-400 transition-colors">Categorias</a>
        <a href="#" class="hover:text-green-400 transition-colors">Contato</a>
      </div>
    </nav>

    <div class="bg-[#1a2e5a] px-10 pt-12 pb-16 text-center">
      <h1 class="text-4xl font-extrabold text-white mb-3">O que você precisa?</h1>
      <p class="text-blue-200 text-base mb-8">
        Base de dúvidas frequentes do departamento de Ciência da Computação - UnB
      </p>

      <div class="flex justify-center">
        <div class="flex w-full max-w-xl rounded-lg overflow-hidden shadow-lg border border-white/10">
          <input
            type="text"
            placeholder="Ex: Como solicitar aproveitamento de disciplina?"
            class="flex-1 bg-[#2b3f6e] text-white placeholder-gray-400 px-5 py-3 text-sm outline-none"
          />
          <button class="bg-white text-[#1a2e5a] font-bold px-6 py-3 text-sm hover:bg-blue-100 transition-colors">
            Buscar
          </button>
        </div>
      </div>
    </div>

    <div class="h-px bg-gray-300 mx-10" />

    <div class="px-10 py-10">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-[#1a2e5a]">Categorias</h2>
        <button class="text-sm text-gray-500 hover:text-[#1a2e5a] transition-colors">Filtrar</button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <NuxtLink to="/academica" class="group">
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-[#1a2e5a] transition-all duration-200 cursor-pointer">
            <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
              <svg class="w-6 h-6 text-[#1a2e5a]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor"/>
                <path d="M7 8h10M7 12h6" stroke="currentColor" stroke-linecap="round"/>
                <circle cx="17" cy="14" r="2" stroke="currentColor"/>
                <path d="M19 16l1.5 1.5" stroke="currentColor" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <p class="font-bold text-[#1a2e5a] text-sm">Matrícula</p>
              <p class="text-xs text-gray-400 mt-0.5">7 perguntas</p>
            </div>
          </div>
        </NuxtLink>

        <NuxtLink to="/reta-final" class="group">
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-[#1a2e5a] transition-all duration-200 cursor-pointer">
            <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
              <svg class="w-6 h-6 text-[#1a2e5a]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path d="M12 3L4 7v5c0 5 4 8 8 9 4-1 8-4 8-9V7l-8-4z" stroke="currentColor"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <p class="font-bold text-[#1a2e5a] text-sm">TCC & Projeto Final</p>
              <p class="text-xs text-gray-400 mt-0.5">11 perguntas</p>
            </div>
          </div>
        </NuxtLink>

        <NuxtLink to="/burocracia" class="group">
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-[#1a2e5a] transition-all duration-200 cursor-pointer">
            <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
              <svg class="w-6 h-6 text-[#1a2e5a]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor"/>
                <path d="M12 12v4M10 14h4" stroke="currentColor" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <p class="font-bold text-[#1a2e5a] text-sm">Estágio</p>
              <p class="text-xs text-gray-400 mt-0.5">7 perguntas</p>
            </div>
          </div>
        </NuxtLink>

        <NuxtLink to="/regras" class="group">
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-[#1a2e5a] transition-all duration-200 cursor-pointer">
            <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
              <svg class="w-6 h-6 text-[#1a2e5a]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <circle cx="5" cy="6" r="1.5" stroke="currentColor"/>
                <circle cx="5" cy="12" r="1.5" stroke="currentColor"/>
                <circle cx="5" cy="18" r="1.5" stroke="currentColor"/>
                <path d="M9 6h10M9 12h10M9 18h10" stroke="currentColor" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <p class="font-bold text-[#1a2e5a] text-sm">Estrutura Curricular</p>
              <p class="text-xs text-gray-400 mt-0.5">11 perguntas</p>
            </div>
          </div>
        </NuxtLink>

        <NuxtLink to="/academica" class="group">
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-[#1a2e5a] transition-all duration-200 cursor-pointer">
            <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
              <svg class="w-6 h-6 text-[#1a2e5a]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path d="M12 2a5 5 0 015 5c0 3-2 5-5 7-3-2-5-4-5-7a5 5 0 015-5z" stroke="currentColor"/>
                <path d="M5 20c0-3 3-5 7-5s7 2 7 5" stroke="currentColor" stroke-linecap="round"/>
                <path d="M9 8h.01M12 6h.01" stroke="currentColor" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <p class="font-bold text-[#1a2e5a] text-sm">Extensão</p>
              <p class="text-xs text-gray-400 mt-0.5">6 perguntas</p>
            </div>
          </div>
        </NuxtLink>

        <NuxtLink to="/burocracia" class="group">
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-[#1a2e5a] transition-all duration-200 cursor-pointer">
            <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
              <svg class="w-6 h-6 text-[#1a2e5a]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="7" r="2.5" stroke="currentColor"/>
                <circle cx="5" cy="17" r="2" stroke="currentColor"/>
                <circle cx="19" cy="17" r="2" stroke="currentColor"/>
                <path d="M12 9.5v3m0 0l-5 3m5-3l5 3" stroke="currentColor" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <p class="font-bold text-[#1a2e5a] text-sm">Coordenação</p>
              <p class="text-xs text-gray-400 mt-0.5">7 perguntas</p>
            </div>
          </div>
        </NuxtLink>

      </div>

      <!-- Chatbot CTA -->
      <div class="flex justify-center mt-6">
        <NuxtLink to="/chatbot" class="group">
          <div class="bg-white rounded-2xl border border-dashed border-[#1a2e5a]/40 shadow-sm px-8 py-4 flex items-center gap-4 hover:shadow-md hover:border-[#1a2e5a] hover:bg-blue-50 transition-all duration-200 cursor-pointer w-fit">
            <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
              <svg class="w-7 h-7 text-[#1a2e5a]" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                <rect x="5" y="7" width="14" height="10" rx="2.5" stroke="currentColor"/>
                <circle cx="9" cy="11" r="1.2" fill="currentColor" stroke="none"/>
                <circle cx="15" cy="11" r="1.2" fill="currentColor" stroke="none"/>
                <path d="M9 14.5h6" stroke="currentColor" stroke-linecap="round"/>
                <path d="M12 7V4" stroke="currentColor" stroke-linecap="round"/>
                <circle cx="12" cy="3.5" r="0.8" fill="currentColor" stroke="none"/>
                <path d="M5 10.5H3.5M18.5 10.5H20" stroke="currentColor" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <p class="font-bold text-[#1a2e5a] text-sm">Assistente Virtual</p>
                <span class="text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full">Em breve</span>
              </div>
              <p class="text-xs text-gray-400 mt-0.5">Tire suas dúvidas com IA</p>
            </div>
          </div>
        </NuxtLink>
      </div>

    </div>

  </div>
</template>
