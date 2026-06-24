<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import type { Snippet } from 'svelte'
  import '../app.css'
  import AppNav from '$lib/components/AppNav.svelte'
  import DepartmentsSidebar from '$lib/components/DepartmentsSidebar.svelte'

  interface Props {
    children?: Snippet
  }

  let { children }: Props = $props()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1
      }
    }
  })
</script>

<QueryClientProvider client={queryClient}>
  <div class="fiaq-shell min-h-screen bg-background font-sans text-foreground">
    <AppNav />
    <main class="fiaq-main flex min-h-0 flex-1 flex-col">
      {@render children?.()}
    </main>
    <DepartmentsSidebar />
  </div>
</QueryClientProvider>
