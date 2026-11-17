<script setup>
// Pastille « aperçu admin » : rappelle que la page n'est visible que par l'administrateur connecté.
defineProps({ text: { type: String, required: true } })
</script>

<template>
  <p class="flag" role="status">{{ text }}</p>
</template>

<style scoped>
.flag{position:fixed;left:12px;bottom:12px;z-index:90;max-width:min(420px,calc(100vw - 24px));margin:0;padding:8px 14px;border:1px solid #f59e0b;border-radius:12px;background:#1b1200;color:#ffe3a3;font-size:13px;line-height:1.4;box-shadow:0 10px 24px -12px rgba(0,0,0,.6)}
</style>
