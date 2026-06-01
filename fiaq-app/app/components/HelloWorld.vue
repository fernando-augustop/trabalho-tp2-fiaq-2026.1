<template>
  <div class="hello">
    <h3>Olá, {{ name }}!</h3>
  </div>
</template>

<script setup>
defineProps({
  name: String
})
</script>

<style scoped>
.hello { border: 1px solid #ddd; padding: 10px; margin: 10px 0; }
</style>
