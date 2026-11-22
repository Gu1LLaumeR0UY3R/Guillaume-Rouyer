<script setup>
import { useRoute } from 'vue-router'
import { bannerOpen, choose, consent } from '../consent.js'
import { t } from '../i18n/index.js'
const route = useRoute()
</script>

<template>
  <Transition name="cb">
    <section v-if="bannerOpen && !route.path.startsWith('/admin')" class="cb" role="dialog" aria-modal="false" aria-labelledby="cb-t" aria-describedby="cb-d">
      <h2 id="cb-t">{{ t('cookie.title') }}</h2>
      <p id="cb-d">{{ t('cookie.text') }} <RouterLink to="/confidentialite">{{ t('cookie.more') }}</RouterLink></p>
      <p v-if="consent" class="now">{{ consent === 'yes' ? t('cookie.nowYes') : t('cookie.nowNo') }}</p>
      <div class="row">
        <button type="button" class="b" @click="choose('no', route.path)">{{ t('cookie.refuse') }}</button>
        <button type="button" class="b" @click="choose('yes', route.path)">{{ t('cookie.accept') }}</button>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
.cb{position:fixed;left:16px;right:16px;bottom:16px;z-index:60;max-width:520px;margin-inline:auto;padding:18px 20px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);color:var(--fg);box-shadow:0 12px 40px rgba(0,0,0,.18)}
h2{margin:0 0 6px;font:600 18px var(--serif)}
p{margin:0 0 12px;font-size:14px;line-height:1.5;color:var(--muted)}
p a{color:var(--green);font-weight:600}
.now{color:var(--fg);font-weight:600}
.row{display:flex;gap:10px;flex-wrap:wrap}
/* Même poids visuel pour accepter et refuser */
.b{flex:1 1 140px;font:600 15px var(--font);padding:10px 16px;border:2px solid var(--green);border-radius:999px;background:transparent;color:var(--green);cursor:pointer}
.b:hover{background:var(--green);color:var(--on-green)}
.b:focus-visible{outline:3px solid var(--neon);outline-offset:2px}
.cb-enter-active,.cb-leave-active{transition:opacity .25s,transform .25s}
.cb-enter-from,.cb-leave-to{opacity:0;transform:translateY(14px)}
@media (prefers-reduced-motion:reduce){.cb-enter-active,.cb-leave-active{transition:none}}
</style>
