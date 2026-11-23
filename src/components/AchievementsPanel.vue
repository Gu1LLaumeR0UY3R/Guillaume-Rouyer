<script setup>
// Succès : liste (boîte de dialogue) et notifications de déblocage, dans un style « carnet de succès » de jeu d'aventure.
// Écoute aussi les événements qui débloquent des succès.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { TOTAL, count, items, loadCustom, onPage, reset, toasts, unlock, unlocked } from '../lib/achievements.js'
const route = useRoute()
const dlg = ref(null)
const fmt = (ms) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const show = () => { if (!dlg.value?.open) dlg.value?.showModal() }
watch(() => route.fullPath, () => onPage(route), { immediate: true })
loadCustom()

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
let pos = 0
function onKey(e) {
  pos = e.key === KONAMI[pos] ? pos + 1 : e.key === KONAMI[0] ? 1 : 0
  if (pos === KONAMI.length) { pos = 0; unlock('konami') }
}
const ev = { 'open-succes': show, 'open-a11y': () => unlock('accessible'), 'forest-plant': () => unlock('jardinier'), 'open-terminal': () => unlock('hacker') }
onMounted(() => { window.addEventListener('keydown', onKey); for (const [n, f] of Object.entries(ev)) window.addEventListener(n, f) })
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); for (const [n, f] of Object.entries(ev)) window.removeEventListener(n, f) })
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <div v-for="t in toasts" :key="t.key" class="toast">
      <span class="gem"><span aria-hidden="true">{{ t.icon }}</span></span>
      <div><small>Succès débloqué</small><b>{{ t.title }}</b></div>
    </div>
  </div>

  <dialog ref="dlg" class="ach" aria-labelledby="ach-t" @click="(e) => e.target === dlg && dlg.close()">
    <header>
      <div>
        <h2 id="ach-t">Succès</h2>
        <p class="prog"><span class="bar"><i :style="{ width: (count / TOTAL) * 100 + '%' }" /></span><b>{{ count }} / {{ TOTAL }}</b></p>
      </div>
      <button type="button" class="x" aria-label="Fermer" @click="dlg.close()">×</button>
    </header>
    <ul>
      <li v-for="a in items" :key="a.id" :class="{ done: unlocked[a.id] }">
        <span class="gem"><span aria-hidden="true">{{ unlocked[a.id] ? a.icon : '🔒' }}</span></span>
        <span class="txt"><b>{{ a.title }}</b><small>{{ a.desc }}</small></span>
        <span class="state">
          <template v-if="unlocked[a.id]"><i class="chk" aria-hidden="true">✓</i><small>{{ fmt(unlocked[a.id]) }}</small><span class="sr">Débloqué</span></template>
          <span v-else class="sr">Verrouillé</span>
        </span>
      </li>
    </ul>
    <footer><p>Enregistrés uniquement dans ton navigateur, sans compte.</p><button type="button" class="reset" @click="reset">Réinitialiser</button></footer>
  </dialog>
</template>

<style scoped>
/* Palette « carnet » : ardoise bleu nuit, papier crème, filets dorés. Ne dépend pas du thème du site. */
.toasts{position:fixed;left:14px;bottom:14px;z-index:60;display:grid;gap:8px;pointer-events:none}
.toast{display:flex;gap:14px;align-items:center;min-width:250px;padding:10px 22px 10px 12px;border-radius:999px 14px 14px 999px;background:#3b4255;color:#ece5d8;box-shadow:0 10px 28px rgba(0,0,0,.35);border:1px solid #d3bc8d;animation:in .45s cubic-bezier(.2,.9,.3,1.1)}
.toast div{display:grid;line-height:1.25}
.toast small{color:#d3bc8d;font:600 12px var(--font);letter-spacing:.06em;text-transform:uppercase}
.toast b{font:600 17px var(--serif)}
@keyframes in{from{transform:translateX(-120%);opacity:0}}
@media(prefers-reduced-motion:reduce){.toast{animation:none}}

/* Cadre en losange doré autour de l'icône */
.gem{flex:none;display:grid;place-items:center;width:46px;height:46px;position:relative}
.gem::before{content:"";position:absolute;inset:5px;transform:rotate(45deg);border-radius:6px;background:linear-gradient(135deg,#f3e3b4,#c9a45a);box-shadow:0 0 0 2px #3b4255,0 0 0 3px #d3bc8d}
.gem>span{position:relative;font-size:20px;line-height:1}

.ach{width:min(560px,calc(100vw - 20px));max-height:88vh;margin:auto;padding:0;border:0;border-radius:18px;background:#ece5d8;color:#3b4255;box-shadow:0 24px 70px rgba(0,0,0,.5);overflow:hidden}
.ach[open]{display:flex;flex-direction:column}
.ach::backdrop{background:rgba(20,24,36,.65)}
header{display:flex;justify-content:space-between;gap:16px;padding:20px 22px 14px;background:#3b4255;color:#ece5d8;border-bottom:3px solid #d3bc8d}
h2{margin:0 0 8px;font:600 26px var(--serif);letter-spacing:.02em}
.prog{display:flex;align-items:center;gap:12px;margin:0;font-size:14px}
.bar{width:180px;max-width:40vw;height:8px;border-radius:99px;background:rgba(236,229,216,.2);overflow:hidden}
.bar i{display:block;height:100%;background:linear-gradient(90deg,#d3bc8d,#f3e3b4);border-radius:99px}
.x{align-self:start;width:40px;height:40px;border:1px solid #d3bc8d;border-radius:50%;background:none;color:#ece5d8;font-size:22px;cursor:pointer}
ul{list-style:none;margin:0;padding:12px;display:grid;gap:8px;overflow:auto}
li{display:flex;align-items:center;gap:12px;padding:10px 14px 10px 8px;border-radius:12px;background:#f6f1e7;border:1px solid #ddd3c0;opacity:.62}
li.done{opacity:1;background:#fff9ec;border-color:#d3bc8d}
li:not(.done) .gem::before{background:#cfc7b6;box-shadow:0 0 0 2px #ece5d8,0 0 0 3px #bfb6a3}
.txt{display:grid;flex:1;min-width:0}
.txt b{font:700 16px var(--font)} .txt small{color:#6b7084;font-size:14px}
.state{display:grid;justify-items:end;gap:2px;color:#6b7084;font-size:12px;text-align:right}
.chk{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#7fae5b;color:#fff;font-style:normal;font-weight:700}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
footer{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;padding:10px 18px 14px;border-top:1px solid #ddd3c0}
footer p{margin:0;color:#6b7084;font-size:13px}
.reset{min-height:36px;padding:0 14px;border:1px solid #bfb6a3;border-radius:999px;background:none;color:#3b4255;font:600 13px var(--font);cursor:pointer}
.x:focus-visible,.reset:focus-visible{outline:3px solid #7a5c14;outline-offset:2px}
@media(max-width:480px){.state small{display:none}}
</style>
