<template>
  <div>
    <header>
      <h2>Meu Site com Nuxt</h2>
      <nav>
        <NuxtLink to="/">Home</NuxtLink> |
        <NuxtLink to="/sobre">Sobre</NuxtLink> |
        <NuxtLink to="/contato">Contato</NuxtLink>
      </nav>
    </header>
    <main>
      <slot /> <!-- aqui entra o conteúdo da página -->
    </main>
    <footer>
      <p>&copy; 2025 - Feito com Nuxt</p>
    </footer>
  </div>
</template>

<style scoped>
header { background: #333; color: white; padding: 12px; }
nav a { margin: 0 8px; color: white; text-decoration: none; }
main { padding: 20px; }
footer { text-align: center; padding: 12px; margin-top: 20px; background: #f2f2f2; }
</style>
