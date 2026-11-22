<script setup>
// Bouton « Accessibilité » + panneau de réglages (boîte de dialogue : focus piégé, Échap pour fermer).
import { ref } from 'vue'
import { prefs, resetPrefs, SIZES } from '../composables/useA11y.js'

const dlg = ref(null)
const opener = ref(null)
const open = ref(false)
function show() { open.value = true; dlg.value.showModal() }
function hide() { dlg.value.close() }
function onClose() { open.value = false; opener.value?.focus() }
function onBackdrop(e) { if (e.target === dlg.value) hide() }

const TOGGLES = [
  ['contrast', 'Contraste renforcé', 'Noir et blanc francs, bordures marquées'],
  ['spacing', 'Espacement du texte', 'Interlignes et espaces entre les mots plus larges'],
  ['font', 'Police très lisible', 'Remplace les polices décoratives par une police simple'],
  ['links', 'Souligner les liens', 'Tous les liens sont soulignés'],
  ['focus', 'Focus très visible', 'Cadre jaune épais autour de l\'élément au clavier'],
  ['motion', 'Réduire les animations', 'Arrête les mouvements (la forêt s\'adapte au prochain chargement)'],
]
</script>

<template>
  <button ref="opener" type="button" class="btn btn-ghost a11y-btn" aria-haspopup="dialog" :aria-expanded="open" @click="show">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4.5" r="1.6" /><path d="M5 8.5l7 1.5 7-1.5M12 10v5m0 0l-3 5.5M12 15l3 5.5" /></svg>
    <span>Accessibilité</span>
  </button>

  <Teleport to="body">
    <dialog ref="dlg" class="a11y-dlg" aria-labelledby="a11y-title" @close="onClose" @click="onBackdrop">
      <div class="box">
        <header>
          <h2 id="a11y-title">Accessibilité</h2>
          <button type="button" class="x" aria-label="Fermer" @click="hide">×</button>
        </header>
        <p class="hint">Ces réglages restent sur cet appareil et ne sont envoyés nulle part.</p>

        <fieldset class="sizes">
          <legend>Taille du texte</legend>
          <label v-for="s in SIZES" :key="s" :class="{ on: prefs.size === s }">
            <input v-model.number="prefs.size" type="radio" name="a11y-size" :value="s" />
            <span :style="{ fontSize: `${12 + (s - 100) / 6}px` }">A</span> {{ s }} %
          </label>
        </fieldset>

        <ul class="opts">
          <li v-for="[key, label, hint] in TOGGLES" :key="key">
            <label>
              <input v-model="prefs[key]" type="checkbox" role="switch" />
              <span class="tx"><strong>{{ label }}</strong><small>{{ hint }}</small></span>
            </label>
          </li>
        </ul>

        <button type="button" class="btn btn-ghost reset" @click="resetPrefs">Tout réinitialiser</button>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.a11y-btn{display:inline-flex;align-items:center;gap:8px}
@media (max-width:560px){.a11y-btn span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}}
.a11y-dlg{width:min(440px,94vw);max-height:92vh;margin:auto 16px auto auto;padding:0;border:1px solid var(--line);border-radius:18px;background:var(--bg);color:var(--fg);overflow:auto}
.a11y-dlg::backdrop{background:rgba(0,0,0,.5)}
@media (max-width:560px){.a11y-dlg{margin:auto}}
.box{display:grid;gap:14px;padding:20px 22px 22px}
header{display:flex;justify-content:space-between;align-items:center}
h2{margin:0;font-size:22px}
.x{width:40px;height:40px;border:1px solid var(--line);border-radius:50%;background:var(--card);color:var(--fg);font-size:24px;line-height:1;cursor:pointer}
.hint{margin:0;color:var(--muted);font-size:14px}
fieldset{margin:0;padding:0;border:0}
legend{margin-bottom:8px;font-weight:700}
.sizes{display:flex;flex-wrap:wrap;gap:8px}
.sizes legend{flex-basis:100%}
.sizes label{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px;border:2px solid var(--line);border-radius:12px;background:var(--card);cursor:pointer;font-weight:600}
.sizes label.on{border-color:var(--green);background:color-mix(in srgb,var(--green) 12%,var(--card))}
.sizes input{position:absolute;opacity:0}
.sizes label:focus-within{outline:3px solid var(--green);outline-offset:2px}
.opts{display:grid;gap:8px;margin:0;padding:0;list-style:none}
.opts label{display:flex;gap:12px;align-items:center;min-height:56px;padding:8px 14px;border:1px solid var(--line);border-radius:12px;background:var(--card);cursor:pointer}
.opts input{width:22px;height:22px;flex:none;accent-color:var(--green)}
.tx{display:grid;gap:2px}
.tx small{color:var(--muted);font-size:13px;line-height:1.35}
.opts label:focus-within{outline:3px solid var(--green);outline-offset:2px}
.reset{justify-self:start}
</style>
