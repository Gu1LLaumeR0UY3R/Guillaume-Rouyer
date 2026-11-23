<script setup>
// Liste des succès (boîte de dialogue) + petites notifications quand un succès est débloqué. Écoute aussi les événements qui en débloquent.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { LIST, count, onPage, reset, toasts, unlock, unlocked } from '../lib/achievements.js'
const route = useRoute()
const dlg = ref(null)
const fmt = (ms) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
const show = () => { if (!dlg.value?.open) dlg.value?.showModal() }
watch(() => route.fullPath, () => onPage(route), { immediate: true })

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
let pos = 0
function onKey(e) {
  pos = e.key === KONAMI[pos] ? pos + 1 : e.key === KONAMI[0] ? 1 : 0
  if (pos === KONAMI.length) { pos = 0; unlock('konami') }
}
const on = (n, f) => window.addEventListener(n, f)
const off = (n, f) => window.removeEventListener(n, f)
const ev = { 'open-succes': show, 'open-a11y': () => unlock('accessible'), 'forest-plant': () => unlock('jardinier'), 'open-terminal': () => unlock('hacker') }
onMounted(() => { window.addEventListener('keydown', onKey); for (const [n, f] of Object.entries(ev)) on(n, f) })
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); for (const [n, f] of Object.entries(ev)) off(n, f) })
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <div v-for="t in toasts" :key="t.key" class="toast"><span aria-hidden="true">{{ t.icon }}</span><div><b>Succès débloqué</b><br />{{ t.title }}</div></div>
  </div>
  <dialog ref="dlg" class="ach" aria-labelledby="ach-t" @click="(e) => e.target === dlg && dlg.close()">
    <header><h2 id="ach-t">Succès <small>{{ count }} / {{ LIST.length }}</small></h2><button type="button" class="x" aria-label="Fermer" @click="dlg.close()">×</button></header>
    <p class="note">Enregistrés uniquement dans ton navigateur, sans compte.</p>
    <ul>
      <li v-for="a in LIST" :key="a.id" :class="{ done: unlocked[a.id] }">
        <span class="ic" aria-hidden="true">{{ unlocked[a.id] ? a.icon : '🔒' }}</span>
        <span><b>{{ a.title }}</b><br /><small>{{ a.desc }}<template v-if="unlocked[a.id]"> · {{ fmt(unlocked[a.id]) }}</template></small></span>
        <span class="sr">{{ unlocked[a.id] ? 'Débloqué' : 'Verrouillé' }}</span>
      </li>
    </ul>
    <button type="button" class="reset" @click="reset">Réinitialiser</button>
  </dialog>
</template>

<style scoped>
.toasts{position:fixed;left:14px;bottom:14px;z-index:60;display:grid;gap:8px;pointer-events:none}
.toast{display:flex;gap:12px;align-items:center;padding:12px 16px;border:1px solid var(--green);border-radius:14px;background:var(--card);color:var(--fg);box-shadow:0 8px 24px rgba(0,0,0,.25);font-size:15px;animation:in .3s ease}
.toast span{font-size:26px}
@keyframes in{from{transform:translateY(12px);opacity:0}}
@media(prefers-reduced-motion:reduce){.toast{animation:none}}
.ach{width:min(520px,calc(100vw - 24px));max-height:86vh;margin:auto;padding:22px;border:1px solid var(--line);border-radius:18px;background:var(--card);color:var(--fg)}
.ach::backdrop{background:rgba(0,0,0,.5)}
header{display:flex;justify-content:space-between;align-items:center}
h2{margin:0;font:600 24px var(--serif)} h2 small{font:600 15px var(--font);color:var(--muted);margin-left:8px}
.x{width:40px;height:40px;border:1px solid var(--line);border-radius:50%;background:none;color:var(--fg);font-size:22px;cursor:pointer}
.note{margin:6px 0 12px;color:var(--muted);font-size:14px}
ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}
li{display:flex;gap:12px;align-items:center;padding:10px 12px;border:1px solid var(--line);border-radius:12px;opacity:.6}
li.done{opacity:1;border-color:var(--green)}
.ic{font-size:24px;width:32px;text-align:center}
small{color:var(--muted)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.reset{margin-top:14px;min-height:40px;padding:0 16px;border:1px solid var(--line);border-radius:999px;background:none;color:var(--muted);font:600 14px var(--font);cursor:pointer}
.x:focus-visible,.reset:focus-visible{outline:3px solid var(--neon);outline-offset:2px}
</style>
