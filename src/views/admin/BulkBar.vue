<script setup>
// Barre d'actions groupées : apparaît quand au moins un élément est coché.
defineProps({ count: Number, busy: Boolean })
defineEmits(['clear'])
</script>

<template>
  <div v-if="count" class="bulk" role="region" aria-label="Actions groupées" aria-live="polite">
    <b>{{ count }} sélectionné(s)</b>
    <slot />
    <button type="button" class="btn btn-ghost small" :disabled="busy" @click="$emit('clear')">Tout désélectionner</button>
  </div>
</template>

<style scoped>
.bulk{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:12px 0;padding:10px 14px;border:1px solid var(--green);border-radius:12px;background:var(--card)}
</style>
