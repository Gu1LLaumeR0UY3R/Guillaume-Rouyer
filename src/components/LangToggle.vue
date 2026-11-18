<script setup>
import { lang, t } from '../i18n/index.js'
</script>

<template>
  <div class="lang" role="group" :aria-label="t('lang.label')">
    <button v-for="l in ['fr', 'en']" :key="l" type="button" :aria-pressed="lang === l" :lang="l" @click="lang = l">{{ l.toUpperCase() }}</button>
  </div>
</template>

<style scoped>
.lang{display:inline-flex;overflow:hidden;border:1px solid var(--green);border-radius:12px}
button{min-height:44px;min-width:44px;padding:0 10px;border:0;background:transparent;color:var(--fg);font:600 14px var(--font);letter-spacing:.06em;cursor:pointer;transition:background .2s,color .2s}
button[aria-pressed=true]{background:var(--green);color:var(--on-green)}
button:not([aria-pressed=true]):hover{background:var(--card)}
</style>
