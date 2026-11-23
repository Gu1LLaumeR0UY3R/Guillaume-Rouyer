<script setup>
// Fenêtre de choix des cookies : au centre de l'écran, deux boutons de même poids. Échap la ferme sans choisir (elle reviendra à la visite suivante).
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { bannerOpen, choose, consent, dntOn } from '../consent.js'
import { t } from '../i18n/index.js'
const route = useRoute()
const dlg = ref(null)
const shown = () => bannerOpen.value && !route.path.startsWith('/admin')
function sync() {
  if (!dlg.value) return
  if (shown() && !dlg.value.open) dlg.value.showModal()
  else if (!shown() && dlg.value.open) dlg.value.close()
}
onMounted(sync)
watch([bannerOpen, () => route.path], () => nextTick(sync))
function dismiss() { bannerOpen.value = false }
</script>

<template>
  <dialog ref="dlg" class="cb" aria-labelledby="cb-t" aria-describedby="cb-d" @cancel.prevent="dismiss">
    <h2 id="cb-t">{{ t('cookie.title') }}</h2>
    <p id="cb-d">{{ t('cookie.text') }} <RouterLink to="/confidentialite" @click="dismiss">{{ t('cookie.more') }}</RouterLink></p>
    <p v-if="dntOn" class="now">Ton navigateur demande de ne pas être suivi : je le respecte, rien ne sera compté.</p>
    <p v-if="consent" class="now">{{ consent === 'yes' ? t('cookie.nowYes') : t('cookie.nowNo') }}</p>
    <div class="row">
      <button type="button" class="b" @click="choose('no', route.path)">{{ t('cookie.refuse') }}</button>
      <button type="button" class="b yes" @click="choose('yes', route.path)">{{ t('cookie.accept') }}</button>
    </div>
  </dialog>
</template>

<style scoped>
.cb{width:min(420px,calc(100vw - 32px));margin:auto;padding:28px 26px 24px;border:1px solid var(--line);border-radius:20px;background:var(--card);color:var(--fg);box-shadow:0 24px 70px rgba(0,0,0,.35);text-align:center}
.cb::backdrop{background:rgba(0,0,0,.5)}
h2{margin:0 0 10px;font:600 24px var(--serif)}
p{margin:0 0 18px;font-size:16px;line-height:1.55;color:var(--muted)}
p a{color:var(--green);font-weight:600}
.now{color:var(--fg);font-weight:600}
.row{display:flex;gap:12px}
/* Même poids visuel pour accepter et refuser */
.b{flex:1;min-height:48px;font:600 16px var(--font);padding:0 16px;border:2px solid var(--green);border-radius:999px;background:transparent;color:var(--green);cursor:pointer}
.b:hover,.b:focus-visible{background:var(--green);color:var(--on-green)}
.b:focus-visible{outline:3px solid var(--neon);outline-offset:2px}
</style>
