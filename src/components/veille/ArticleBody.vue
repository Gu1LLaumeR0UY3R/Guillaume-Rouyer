<script setup>
// Affiche le HTML d'un article (produit par renderMarkdown) : bouton « Copier » des blocs de code et zoom des images.
import { reactive, ref } from 'vue'
import '../../styles/article.css'

defineProps({ html: { type: String, default: '' } })
const dlg = ref(null)
const zoom = reactive({ src: '', alt: '', caption: '' })
let opener = null

function flash(btn, label) {
  const old = btn.textContent
  btn.textContent = label
  setTimeout(() => { btn.textContent = old }, 1800)
}
async function onClick(ev) {
  const copy = ev.target.closest?.('[data-copy]')
  if (copy) {
    const code = copy.closest('.code')?.querySelector('code')?.textContent ?? ''
    try { await navigator.clipboard.writeText(code); flash(copy, 'Copié ✓') } catch { flash(copy, 'Échec de la copie') }
    return
  }
  const z = ev.target.closest?.('[data-zoom]')
  if (z) {
    const img = z.querySelector('img')
    if (!img) return
    Object.assign(zoom, { src: img.src, alt: img.alt, caption: z.closest('figure')?.querySelector('figcaption')?.textContent ?? '' })
    opener = z
    dlg.value.showModal ? dlg.value.showModal() : dlg.value.setAttribute('open', '')
  }
}
function close() { dlg.value.close ? dlg.value.close() : dlg.value.removeAttribute('open'); opener?.focus() }
</script>

<template>
  <div>
    <div class="art" @click="onClick" v-html="html" />
    <dialog ref="dlg" class="lightbox" aria-label="Image agrandie" @click.self="close" @cancel="opener?.focus()">
      <img v-if="zoom.src" :src="zoom.src" :alt="zoom.alt" referrerpolicy="no-referrer" />
      <p v-if="zoom.caption">{{ zoom.caption }}</p>
      <button type="button" class="lightbox-close" @click="close">Fermer</button>
    </dialog>
  </div>
</template>

<style scoped>
.lightbox{max-width:min(96vw,1200px);max-height:94vh;padding:12px;border:0;border-radius:14px;background:var(--bg);color:var(--fg);text-align:center}
.lightbox::backdrop{background:rgba(0,0,0,.82)}
.lightbox img{display:block;max-width:100%;max-height:78vh;margin:0 auto;object-fit:contain;border-radius:8px}
.lightbox p{margin:10px 0 0;color:var(--muted);font-size:14px}
.lightbox-close{margin-top:12px;min-height:44px;padding:0 22px;border:1px solid var(--green);border-radius:12px;background:var(--green);color:var(--on-green);font:600 16px var(--font);cursor:pointer}
</style>
