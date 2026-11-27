<script setup>
// Petits boutons ronds fixes en bas à droite : recherche (Ctrl K), accessibilité, thème. La barre de navigation ne garde que les liens.
import { useTheme } from '../composables/useTheme.js'
import A11yPanel from './A11yPanel.vue'
const { theme, toggle } = useTheme()
const fire = (n) => () => window.dispatchEvent(new CustomEvent(n))
</script>

<template>
  <aside class="dock" aria-label="Outils du site">
    <button type="button" aria-label="Rechercher (Ctrl K)" title="Rechercher (Ctrl K)" @click="fire('open-palette')()">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    </button>
    <button type="button" aria-label="Mes succès" title="Mes succès" aria-haspopup="dialog" @click="fire('open-succes')()">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>
    </button>
    <button type="button" aria-label="Accessibilité" title="Accessibilité" aria-haspopup="dialog" @click="fire('open-a11y')()">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4.5" r="1.6"/><path d="M5 8.5l7 1.5 7-1.5M12 10v4.5m0 0-3 5.5m3-5.5 3 5.5"/></svg>
    </button>
    <button type="button" :aria-pressed="theme === 'dark'" :aria-label="theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'" :title="theme === 'dark' ? 'Mode clair' : 'Mode sombre'" @click="toggle">
      <svg v-if="theme === 'dark'" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/></svg>
      <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
    </button>
    <A11yPanel headless />
  </aside>
</template>

<style scoped>
.dock{position:fixed;right:14px;bottom:14px;z-index:30;display:flex;flex-direction:column;gap:8px}
button{display:grid;place-items:center;width:46px;height:46px;padding:0;border:1px solid var(--line);border-radius:50%;background:var(--card);color:var(--fg);box-shadow:0 4px 14px rgba(0,0,0,.18);cursor:pointer}
button:hover{border-color:var(--green);color:var(--green)}
button:focus-visible{outline:3px solid var(--neon);outline-offset:2px}
@media(max-width:600px){.dock{right:10px;bottom:10px}button{width:44px;height:44px}}
</style>
