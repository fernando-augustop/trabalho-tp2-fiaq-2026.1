<script lang="ts">
  import Button from '$lib/components/ui/button.svelte'
  import FiaqBrand from '$lib/components/FiaqBrand.svelte'
  import { openDepartmentsSidebar } from '$lib/stores/departments-sidebar'
</script>

<nav class="fiaq-nav sticky top-0 z-50 flex shrink-0 items-center justify-between gap-2 bg-[#1a2e5a] px-3 py-2.5 sm:gap-3 sm:px-10 sm:py-4">
  <FiaqBrand class="shrink-0" />

  <div class="fiaq-nav-links flex shrink-0 items-center gap-2.5 text-[11px] font-medium text-white sm:gap-8 sm:text-sm">
    <a
      href="/"
      class="rounded-md px-1 py-1 transition-colors hover:text-green-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
    >
      Início
    </a>

    <Button
      variant="ghost"
      class="m-0 cursor-pointer rounded-md border-0 bg-transparent px-1 py-1 font-medium text-white shadow-none hover:bg-transparent hover:text-green-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
      onclick={openDepartmentsSidebar}
    >
      Contatos
    </Button>

    <a
      href="/sobre"
      class="rounded-md px-1 py-1 transition-colors hover:text-green-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
    >
      Sobre
    </a>
  </div>
</nav>
