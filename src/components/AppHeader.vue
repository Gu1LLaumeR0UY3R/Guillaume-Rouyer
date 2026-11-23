<script setup>
import { NAV } from '../data/nav.js'
import ThemeToggle from './ThemeToggle.vue'
import A11yPanel from './A11yPanel.vue'
const openPalette = () => window.dispatchEvent(new CustomEvent('open-palette'))
</script>

<template>
  <header class="site-header">
    <RouterLink class="brand" to="/">Er1gon<span>359</span></RouterLink>
    <nav aria-label="Navigation principale">
      <ul>
        <li v-for="item in NAV" :key="item.to"><RouterLink :to="item.to">{{ item.label }}</RouterLink></li>
        <li><button type="button" class="btn btn-ghost srch" aria-label="Rechercher (Ctrl K)" title="Rechercher (Ctrl K)" @click="openPalette">⌕ <kbd>Ctrl K</kbd></button></li>
        <li><A11yPanel /></li>
        <li><ThemeToggle /></li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
.site-header{position:sticky;top:0;z-index:20;display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;padding:14px clamp(20px,5vw,48px);border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(8px)}
.brand{font:700 22px var(--serif);text-decoration:none}
.brand span{color:var(--green)}
ul{display:flex;gap:22px;flex-wrap:wrap;align-items:center;margin:0;padding:0;list-style:none}
li a{font-size:15px;text-decoration:none}
li a:hover,li a.router-link-active{color:var(--green)}
li a.router-link-active{font-weight:600}
.srch{min-height:44px;display:inline-flex;gap:8px;align-items:center}
.srch kbd{font:600 12px var(--font);padding:1px 6px;border:1px solid var(--line);border-radius:6px}
@media(max-width:700px){.srch kbd{display:none}}
</style>
