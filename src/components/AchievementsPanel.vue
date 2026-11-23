<script setup>
// Succès : liste par catégorie avec détail, rareté et progression, et notifications de déblocage (style carnet de jeu d'aventure).
// Écoute aussi les événements qui débloquent des succès.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { CATS, RARITY, TOTAL, count, items, loadCustom, onPage, reset, toasts, unlock, unlocked } from '../lib/achievements.js'
import AchEmblem from './AchEmblem.vue'
const route = useRoute()
const dlg = ref(null)
const cat = ref('Tout')
const sel = ref(null)
const fmt = (ms) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const stars = (n) => '✦'.repeat(n)
const shown = computed(() => items.value.filter((a) => cat.value === 'Tout' || a.cat === cat.value))
const catCount = (c) => { const l = items.value.filter((a) => a.cat === c); return `${l.filter((a) => unlocked.value[a.id]).length}/${l.length}` }
const detail = computed(() => items.value.find((a) => a.id === sel.value))
const show = () => { if (!dlg.value?.open) { sel.value = null; dlg.value?.showModal() } }
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
    <div v-for="t in toasts" :key="t.key" :class="['toast', 'r' + t.rarity]">
      <span class="burst" aria-hidden="true"><i v-for="n in 8" :key="n" :style="{ '--a': n * 45 + 'deg' }">✦</i></span>
      <AchEmblem :kind="t.emblem" :rarity="t.rarity" :size="52" />
      <div><small>Succès débloqué · {{ stars(t.rarity) }}</small><b>{{ t.title }}</b></div>
    </div>
  </div>

  <dialog ref="dlg" class="ach" aria-labelledby="ach-t" @click="(e) => e.target === dlg && dlg.close()">
    <header>
      <div>
        <h2 id="ach-t">Succès</h2>
        <p class="prog"><span class="bar"><i :style="{ width: (count / TOTAL) * 100 + '%' }" /></span><b>{{ count }} / {{ TOTAL }} succès débloqués</b></p>
      </div>
      <button type="button" class="x" aria-label="Fermer" @click="dlg.close()">×</button>
    </header>

    <div class="tabs" role="group" aria-label="Catégories">
      <button type="button" :aria-pressed="cat === 'Tout'" :class="{ on: cat === 'Tout' }" @click="cat = 'Tout'">Tout <small>{{ count }}/{{ TOTAL }}</small></button>
      <button v-for="c in CATS" :key="c" type="button" :aria-pressed="cat === c" :class="{ on: cat === c }" @click="cat = c">{{ c }} <small>{{ catCount(c) }}</small></button>
    </div>

    <section v-if="detail" class="detail" aria-live="polite">
      <AchEmblem :kind="detail.emblem" :rarity="detail.rarity" :locked="!unlocked[detail.id]" :size="96" />
      <div>
        <p class="rar" :class="'r' + detail.rarity">{{ stars(detail.rarity) }} {{ RARITY[detail.rarity] }} · {{ detail.cat }}</p>
        <h3>{{ detail.title }}</h3>
        <p>{{ detail.desc }}</p>
        <p class="when">{{ unlocked[detail.id] ? 'Obtenu le ' + fmt(unlocked[detail.id]) : 'Pas encore obtenu' }}</p>
      </div>
      <button type="button" class="x sm" aria-label="Fermer le détail" @click="sel = null">×</button>
    </section>

    <ul>
      <li v-for="a in shown" :key="a.id">
        <button type="button" class="card" :class="[{ done: unlocked[a.id], on: sel === a.id }, 'r' + a.rarity]" :aria-pressed="sel === a.id" @click="sel = sel === a.id ? null : a.id">
          <AchEmblem :kind="a.emblem" :rarity="a.rarity" :locked="!unlocked[a.id]" :size="52" />
          <span class="txt"><b>{{ a.title }}</b><small>{{ a.desc }}</small><em :class="'r' + a.rarity">{{ stars(a.rarity) }}</em></span>
          <span class="state">
            <template v-if="unlocked[a.id]"><i class="chk" aria-hidden="true">✓</i><small>{{ fmt(unlocked[a.id]) }}</small><span class="sr">Débloqué</span></template>
            <span v-else class="sr">Verrouillé</span>
          </span>
        </button>
      </li>
    </ul>
    <footer><p>Enregistrés uniquement dans ton navigateur, sans compte.</p><button type="button" class="reset" @click="reset">Réinitialiser</button></footer>
  </dialog>
</template>

<style scoped>
/* Palette carnet : fond #EDE7DA, cartes #FBF7ED, bordures #D7C49A, doré #C5A45D, texte #49443D / #918879, obtenu #78A66A. Indépendante du thème du site. */
.toasts{position:fixed;left:14px;bottom:14px;z-index:60;display:grid;gap:10px;pointer-events:none}
.toast{position:relative;display:flex;gap:14px;align-items:center;min-width:270px;padding:8px 24px 8px 10px;border-radius:999px 16px 16px 999px;background:#49443d;color:#fbf7ed;border:1px solid #c5a45d;box-shadow:0 10px 28px rgba(0,0,0,.35);animation:in .5s cubic-bezier(.2,.9,.3,1.1)}
.toast div{display:grid;line-height:1.3}
.toast small{color:#e3cf9c;font:600 12px var(--font);letter-spacing:.05em;text-transform:uppercase}
.toast b{font:600 18px var(--serif)}
@keyframes in{from{transform:translateX(-120%);opacity:0}}
/* explosion d'étoiles dorées autour de l'emblème */
.burst{position:absolute;left:36px;top:50%;width:0;height:0}
.burst i{position:absolute;color:#e8c872;font-style:normal;font-size:14px;opacity:0;animation:spark 1s .35s ease-out}
@keyframes spark{0%{opacity:1;transform:rotate(var(--a)) translateX(0) scale(.5)}100%{opacity:0;transform:rotate(var(--a)) translateX(46px) scale(1.2)}}
@media(prefers-reduced-motion:reduce){.toast{animation:none}.burst{display:none}}

.ach{width:min(600px,calc(100vw - 20px));max-height:90vh;margin:auto;padding:0;border:0;border-radius:18px;background:#ede7da;color:#49443d;box-shadow:0 24px 70px rgba(0,0,0,.5);overflow:hidden}
.ach[open]{display:flex;flex-direction:column}
.ach::backdrop{background:rgba(30,26,20,.65)}
header{flex:none;display:flex;justify-content:space-between;gap:16px;padding:20px 22px 14px;background:#49443d;color:#fbf7ed;border-bottom:3px solid #c5a45d}
h2{margin:0 0 8px;font:600 26px var(--serif);letter-spacing:.02em}
.prog{display:flex;align-items:center;gap:12px;margin:0;font-size:14px;flex-wrap:wrap}
.bar{width:190px;max-width:40vw;height:9px;border-radius:99px;background:rgba(251,247,237,.2);overflow:hidden}
.bar i{display:block;height:100%;background:linear-gradient(90deg,#c5a45d,#f1dca0);border-radius:99px;transition:width .6s}
.x{flex:none;align-self:start;width:40px;height:40px;border:1px solid #c5a45d;border-radius:50%;background:none;color:inherit;font-size:22px;cursor:pointer}
.x.sm{width:32px;height:32px;font-size:18px;color:#49443d;border-color:#d7c49a}
.tabs{flex:none;display:flex;gap:6px;padding:10px 12px 0;overflow-x:auto}
.tabs button{flex:none;min-height:38px;padding:0 14px;border:1px solid #d7c49a;border-bottom:0;border-radius:10px 10px 0 0;background:transparent;color:#918879;font:700 14px var(--font);cursor:pointer}
.tabs button small{margin-left:4px;font-weight:600}
.tabs button.on{background:#fbf7ed;color:#49443d}
.detail{position:relative;flex:none;display:flex;gap:18px;align-items:center;margin:0 12px;padding:16px 50px 16px 16px;border:1px solid #d7c49a;border-radius:0 0 12px 12px;background:#fbf7ed;background-image:radial-gradient(circle at 12% 20%,rgba(197,164,93,.18),transparent 55%)}
.detail .x{position:absolute;right:10px;top:10px}
.detail h3{margin:2px 0 4px;font:600 22px var(--serif)} .detail p{margin:0 0 4px}
.detail .when{color:#918879;font-size:14px}
.rar{font:700 13px var(--font);letter-spacing:.04em;text-transform:uppercase}
.r1.rar,em.r1{color:#8b909a} .r2.rar,em.r2{color:#78a66a} .r3.rar,em.r3{color:#5b8fd1} .r4.rar,em.r4{color:#c5a45d}
ul{list-style:none;margin:0;padding:12px;display:grid;gap:8px;overflow:auto}
.card{position:relative;display:flex;width:100%;align-items:center;gap:12px;padding:10px 14px 10px 8px;border:1px solid #d7c49a;border-radius:12px;background:#f2ede1;color:#49443d;text-align:left;font:inherit;cursor:pointer;transition:box-shadow .2s,border-color .2s}
.card:not(.done){border-color:#dcd5c6;background:#e9e3d6}
.card:not(.done) b{color:#6a6458}
.card.done{background:#fbf7ed;border-color:#c5a45d;box-shadow:inset 0 0 0 1px #f1e3bd}
.card.done:hover,.card.done:focus-visible,.card.on{box-shadow:0 0 0 2px rgba(197,164,93,.55),0 0 18px rgba(197,164,93,.55)}
.card:not(.done):hover{border-color:#c4bcaa}
.card:focus-visible{outline:3px solid #7a5c14;outline-offset:2px}
/* ornements d'angle sur les cartes obtenues */
.card.done::before,.card.done::after{content:"✦";position:absolute;color:#c5a45d;font-size:11px;line-height:1}
.card.done::before{left:5px;top:3px}.card.done::after{right:6px;bottom:3px;opacity:.7}
.txt{display:grid;flex:1;min-width:0}
.txt b{font:700 16px var(--font)} .txt small{color:#918879;font-size:14px} .txt em{font-style:normal;font-size:11px;letter-spacing:.2em;margin-top:2px}
.card:not(.done) .txt small{color:#7d7667}
.state{display:grid;justify-items:end;gap:2px;color:#918879;font-size:12px;text-align:right}
.chk{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#78a66a;color:#fff;font-style:normal;font-weight:700}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
footer{flex:none;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;padding:10px 18px 14px;border-top:1px solid #d7c49a}
footer p{margin:0;color:#918879;font-size:13px}
.reset{min-height:36px;padding:0 14px;border:1px solid #c4bcaa;border-radius:999px;background:none;color:#49443d;font:600 13px var(--font);cursor:pointer}
.x:focus-visible,.reset:focus-visible,.tabs button:focus-visible{outline:3px solid #7a5c14;outline-offset:2px}
@media(max-width:480px){.state small{display:none}.detail{flex-direction:column;align-items:flex-start}}
@media(prefers-reduced-motion:reduce){.bar i,.card{transition:none}}
</style>
