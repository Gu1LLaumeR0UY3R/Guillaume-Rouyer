<script setup>
// Page À propos : seule page au style nordique (bannière avec wyvern). Les couleurs sont limitées à `.saga`, le reste du site ne change pas.
import AboutSection from '../components/AboutSection.vue'
import TimelineSection from '../components/TimelineSection.vue'
import LangToggle from '../components/LangToggle.vue'
import NorseScene from '../components/NorseScene.vue'
import { loadSite } from '../content/site.js'
import { t } from '../i18n/index.js'

loadSite()
</script>

<template>
  <div class="saga">
    <header class="banner">
      <NorseScene />
      <div class="container">
        <div class="top"><p class="runes" aria-hidden="true">ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ</p><LangToggle /></div>
        <h1>Guillaume Rouyer</h1>
        <p class="sub">{{ t('hero.titleA') }} {{ t('hero.titleB') }}</p>
      </div>
    </header>
    <AboutSection />
    <TimelineSection />
  </div>
</template>

<style>
.saga{--bg:#f4efe4;--fg:#1b1a17;--muted:#5c5648;--card:#ebe3d2;--line:#d6cbb3;--green:#7a5a14;--neon:#1d6a96;--glow:rgba(122,90,20,.25);--on-green:#fff;--serif:'Cinzel Variable','Cinzel','Fraunces Variable',Georgia,serif;--runic:'Noto Sans Runic',serif;background:var(--bg);color:var(--fg)}
:root[data-theme=dark] .saga{--bg:#0a0e14;--fg:#ece6d8;--muted:#a3abb7;--card:#111823;--line:#243042;--green:#c8a24a;--neon:#7fc4e8;--glow:rgba(200,162,74,.3);--on-green:#14100a}
.saga h1,.saga h2,.saga h3{font-weight:600;letter-spacing:.02em}
.saga .banner{position:relative;overflow:hidden;display:flex;align-items:flex-end;min-height:clamp(300px,34vw,420px);padding:72px 0 36px;border-radius:0 0 32px 32px;color:#f2ecdf}
:root:not([data-theme=dark]) .saga .banner{color:#1f180f}
.saga .banner>.container{position:relative;z-index:1;width:100%}
.saga .banner .top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px}
.saga .banner .runes{margin:0;color:var(--green);font:400 20px var(--runic);letter-spacing:.5em;animation:glow 5s ease-in-out infinite}
:root[data-theme=dark] .saga .banner .runes{color:#e0bd62}
.saga .banner h1{font-size:clamp(34px,6vw,60px);text-shadow:0 2px 22px rgba(0,0,0,.45)}
:root:not([data-theme=dark]) .saga .banner h1{text-shadow:0 0 18px rgba(255,248,230,.7)}
.saga .banner .sub{margin:8px 0 0;font:600 clamp(16px,2.2vw,22px) var(--serif);letter-spacing:.06em;opacity:.9}
.saga .banner .lang button{color:inherit}
.saga .banner .lang button[aria-pressed=true]{color:var(--on-green)}
@keyframes glow{50%{opacity:.4}}
</style>
