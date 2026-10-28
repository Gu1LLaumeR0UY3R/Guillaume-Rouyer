<script setup>
import { NAV } from '../data/nav.js'
import ThemeToggle from './ThemeToggle.vue'
</script>

<template>
  <header class="site-header">
    <a class="brand" href="#accueil">Er1gon<span>359</span></a>
    <nav aria-label="Navigation principale">
      <ul>
        <li v-for="item in NAV" :key="item.id"><a :href="`#${item.id}`">{{ item.label }}</a></li>
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
li a:hover{color:var(--green)}
</style>
