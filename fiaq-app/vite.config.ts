import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: ['omission-crafty-helpful.ngrok-free.dev']
  },
  preview: {
    allowedHosts: ['omission-crafty-helpful.ngrok-free.dev']
  },
  plugins: [
    sveltekit(),
    tailwindcss()
  ],
  optimizeDeps: {
    include: ['marked', 'isomorphic-dompurify', 'jspdf']
  }
})
