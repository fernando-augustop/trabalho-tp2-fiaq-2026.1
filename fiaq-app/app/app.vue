<script setup>
const criticalCss = `
@layer base {
*,::before,::after{box-sizing:border-box}
:root{--nav-height:68px}
html{font-family:"Public Sans",Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:17px}
body{margin:0;background:#f4f4f4;color:#1a2e5a}
a{color:inherit;text-decoration:none}
button,input{font:inherit}
#__nuxt{min-height:100vh}
.fiaq-shell{min-height:100vh;background:#f4f4f4;display:flex;flex-direction:column}
.fiaq-nav{background:#1a2e5a;display:flex;align-items:center;justify-content:space-between;padding:1rem 1.5rem;flex-shrink:0;position:sticky;top:0;z-index:50}
.fiaq-logo{color:#fff;font-size:2.25rem;line-height:1;font-weight:900;letter-spacing:0}
.fiaq-logo-accent{color:#00a155}
.fiaq-nav-links{display:flex;gap:1.5rem;color:#fff;font-size:.875rem;font-weight:500}
.fiaq-main{flex:1}
.fiaq-home-hero{background:#1a2e5a;padding:3rem 1.5rem 4rem;text-align:center}
.fiaq-home-badge{display:inline-flex;align-items:center;gap:.375rem;margin-bottom:1.25rem;border:1px solid rgba(0,220,130,.3);border-radius:9999px;background:rgba(0,220,130,.15);color:#75edae;padding:.25rem .75rem;font-size:11px;font-weight:700}
.fiaq-home-title{margin:0 0 .75rem;color:#fff;font-size:1.875rem;line-height:2.25rem;font-weight:800}
.fiaq-home-subtitle{max-width:42rem;margin:0 auto 2rem;color:#bfdbfe;font-size:1rem;line-height:1.5rem}
.fiaq-search-form{display:flex;justify-content:center}
.fiaq-search-box{display:flex;width:100%;max-width:42rem;overflow:hidden;border:1px solid rgba(0,161,85,.95);border-radius:.75rem;background:#fff;box-shadow:0 18px 42px rgba(4,12,30,.22),0 0 0 1px rgba(0,220,130,.35)}
.fiaq-search-input{min-width:0;flex:1;border:0;background:#fff;color:#1a2e5a;padding:1rem 1.25rem;font-size:1rem;outline:0}
.fiaq-search-input::placeholder{color:#64748b}
.fiaq-search-button{display:flex;align-items:center;gap:.5rem;flex-shrink:0;border:0;border-left:1px solid rgba(6,95,70,.25);background:#00a155;color:#0a2e1a;padding:1rem 1.5rem;font-size:1rem;font-weight:800;cursor:pointer}
.fiaq-assistant-link{display:inline-flex;align-items:center;gap:.375rem;margin-top:1rem;color:#bfdbfe;font-size:.875rem;font-weight:500}
.fiaq-faq-section{max-width:64rem;margin:0 auto;padding:2.5rem 1.5rem}
.fiaq-section-title{margin:0 0 1.5rem;color:#1a2e5a;font-size:1.25rem;line-height:1.75rem;font-weight:800}
.fiaq-faq-grid{display:grid;grid-template-columns:1fr;gap:1rem}
.fiaq-faq-grid>a{display:block}
.fiaq-faq-card{min-height:5.5rem;display:flex;align-items:center;gap:1rem;border:1px solid #e5e7eb;border-radius:1rem;background:#fff;padding:1rem 1.25rem;box-shadow:0 1px 2px rgba(15,23,42,.06)}
.fiaq-faq-icon{display:flex;width:3rem;height:3rem;align-items:center;justify-content:center;flex-shrink:0;border-radius:.75rem;background:#f3f4f6;color:#1a2e5a}
.fiaq-faq-title{margin:0;color:#1a2e5a;font-size:.875rem;font-weight:800}
.fiaq-faq-count{margin:.125rem 0 0;color:#9ca3af;font-size:.75rem}
@media (min-width:640px){:root{--nav-height:80px}.fiaq-nav{padding-left:2.5rem;padding-right:2.5rem}.fiaq-logo{font-size:3rem}.fiaq-nav-links{gap:2rem}.fiaq-home-title{font-size:2.25rem;line-height:2.5rem}.fiaq-faq-section{padding-left:2.5rem;padding-right:2.5rem}.fiaq-faq-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:1024px){.fiaq-faq-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
}
`

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  style: [
    {
      id: 'fiaq-critical-css',
      innerHTML: criticalCss
    }
  ],
  link: [
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png?v=sarue' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png?v=sarue' },
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg?v=sarue' },
    { rel: 'shortcut icon', type: 'image/x-icon', href: '/favicon.ico?v=sarue' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png?v=sarue' }
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
