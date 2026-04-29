<template>
  <div class="min-h-screen bg-[#f4f4f4] font-sans">

    <!-- Navbar -->
    <nav class="bg-[#1a2e5a] px-10 py-4 flex items-center justify-between">
      <div class="text-white text-5xl font-black tracking-tight">
        <span class="text-white">f</span><span class="text-green-400">IA</span><span class="text-white">q</span>
      </div>
      <div class="flex gap-8 text-white text-sm font-medium">
        <a href="#" class="hover:text-green-400 transition-colors">FAQ</a>
        <a href="/academica" class="hover:text-green-400 transition-colors">Categorias</a>
        <a href="#" class="hover:text-green-400 transition-colors">Contato</a>
      </div>
    </nav>

    <!-- Hero -->
    <div class="bg-[#1a2e5a] px-10 pt-12 pb-16 text-center">
      <h1 class="text-4xl font-extrabold text-white mb-3">O que você precisa?</h1>
      <p class="text-blue-200 text-base mb-8">
        Base de dúvidas frequentes do departamento de Ciência da Computação - UnB
      </p>

      <!-- Search bar -->
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

    <!-- Divider -->
    <div class="h-px bg-gray-300 mx-10" />

    <!-- Categories -->
    <div class="px-10 py-10">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-[#1a2e5a]">Categorias</h2>
        <button class="text-sm text-gray-500 hover:text-[#1a2e5a] transition-colors">Filtrar</button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <!-- Matrícula -->
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

        <!-- TCC & Projeto Final -->
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

        <!-- Estágio -->
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

        <!-- Estrutura Curricular -->
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

        <!-- Extensão -->
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

        <!-- Coordenação -->
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
    </div>

  </div>
</template>
