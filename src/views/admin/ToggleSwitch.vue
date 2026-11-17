<script setup>
// Interrupteur accessible (bouton role="switch"). `compact` cache le texte à l'écran mais le garde pour les lecteurs d'écran.
defineProps({ modelValue: Boolean, label: { type: String, required: true }, disabled: Boolean, compact: Boolean })
defineEmits(['update:modelValue'])
</script>

<template>
  <button type="button" class="switch" role="switch" :aria-checked="modelValue" :disabled="disabled" @click="$emit('update:modelValue', !modelValue)">
    <span class="track" aria-hidden="true"><span class="knob" /></span>
    <span :class="compact ? 'sr' : 'text'">{{ label }}</span>
  </button>
</template>

<style scoped>
.switch{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0;border:0;background:none;color:var(--fg);font:600 15px var(--font);cursor:pointer;text-align:left}
.switch:disabled{opacity:.5;cursor:not-allowed}
.track{position:relative;flex:none;width:46px;height:26px;border:1px solid var(--line);border-radius:999px;background:var(--bg);transition:background .2s,border-color .2s}
.knob{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:var(--muted);transition:transform .2s,background .2s}
.switch[aria-checked='true'] .track{border-color:var(--green);background:var(--green)}
.switch[aria-checked='true'] .knob{transform:translateX(20px);background:var(--on-green)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (prefers-reduced-motion:reduce){.track,.knob{transition:none}}
</style>
