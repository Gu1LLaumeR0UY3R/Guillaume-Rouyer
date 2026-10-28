<script setup>
defineProps({ title: { type: String, required: true }, updated: { type: String, required: true } })
</script>

<template>
  <article class="legal">
    <div class="container narrow">
      <h1>{{ title }}</h1>
      <p class="updated">Dernière mise à jour : {{ updated }}</p>
      <slot />
    </div>
  </article>
</template>

<style scoped>
.legal{padding:72px 0}
.narrow{max-width:800px}
h1{margin-bottom:8px;font-size:clamp(34px,5vw,48px)}
.updated{margin:0 0 24px;color:var(--muted);font-size:14px}
:slotted(h2){margin:32px 0 10px;font-size:24px}
:slotted(p),:slotted(li){color:var(--muted)}
:slotted(ul){padding-left:22px}
:slotted(a){color:var(--green)}
</style>
