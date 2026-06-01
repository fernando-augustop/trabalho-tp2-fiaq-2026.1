<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
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
