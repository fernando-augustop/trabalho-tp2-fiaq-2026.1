<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
  ],
  htmlAttrs: {
    lang: 'pt-BR'
  }
})

const title = 'fIAq — Assistente do CIC/UnB'
const description = 'Portal de dúvidas frequentes do Departamento de Ciência da Computação da UnB, '
  + 'com FAQ por tema e assistente virtual com IA baseado no conteúdo institucional oficial.'

useSeoMeta({
  title,
  titleTemplate: t => (t && t !== title ? t : title),
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  twitterCard: 'summary'
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
