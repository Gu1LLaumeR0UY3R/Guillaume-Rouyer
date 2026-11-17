<script setup>
// Bannière d'annonce de la page d'accueil, juste avant les projets.
// Fermable : une fois fermée, elle reste fermée tant que le texte, le type ou le lien ne changent pas.
// `preview` (admin) : on affiche l'annonce passée en prop, sans tenir compte de la fermeture.
import { computed, ref } from 'vue'
import { settings } from '../content/settings.js'

const props = defineProps({ preview: { type: Object, default: null } })
const a = computed(() => props.preview ?? settings.value.announcement)
const TYPES = { info: { label: 'Info', icon: 'i' }, nouveau: { label: 'Nouveau', icon: '★' }, important: { label: 'Important', icon: '!' } }
const type = computed(() => TYPES[a.value?.type] ?? TYPES.info)

const KEY = 'announcement-closed'
const id = computed(() => {
  const s = `${a.value?.text}|${a.value?.type}|${a.value?.link}`
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return String(h)
})
const read = () => { try { return localStorage.getItem(KEY) } catch { return null } }
const closedId = ref(read())
const open = computed(() => !!a.value && (props.preview !== null || closedId.value !== id.value))
function close() {
  closedId.value = id.value
  try { localStorage.setItem(KEY, id.value) } catch { /* stockage indisponible : la bannière reviendra au prochain chargement */ }
}

// Adresse sûre uniquement (le serveur la vérifie aussi) : page du site ou https
const href = computed(() => {
  const l = a.value?.link || ''
  return l.startsWith('https://') || (l.startsWith('/') && !l.startsWith('//')) ? l : ''
})
const external = computed(() => href.value.startsWith('https://'))
</script>

<template>
  <Transition name="ann">
    <section v-if="open" class="ann" :class="a.type" role="region" aria-label="Annonce">
      <div class="container">
        <div class="box">
          <span class="ico" aria-hidden="true">{{ type.icon }}</span>
          <p class="txt"><strong class="kind">{{ type.label }}</strong><span class="msg">{{ a.text }}</span></p>
          <component :is="external ? 'a' : 'RouterLink'" v-if="href" class="lnk" v-bind="external ? { href, target: '_blank', rel: 'noopener' } : { to: href }">{{ a.linkLabel || 'En savoir plus' }} →</component>
          <button v-if="preview === null" type="button" class="x" aria-label="Fermer l'annonce" title="Fermer (elle ne reviendra pas tant qu'elle ne change pas)" @click="close">×</button>
        </div>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
.ann{--c:var(--green);padding:20px 0 4px;overflow:hidden}
.ann.nouveau{--c:#2563eb}
.ann.important{--c:#d97706}
.box{position:relative;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;padding:14px 52px 14px 16px;border:1px solid color-mix(in srgb,var(--c) 40%,var(--line));border-left:5px solid var(--c);border-radius:16px;background:color-mix(in srgb,var(--c) 8%,var(--card));box-shadow:0 10px 26px -20px var(--c)}
.ico{display:inline-flex;flex:none;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:var(--c);color:#fff;font:700 16px/1 var(--font)}
[data-theme=dark] .ann:not(.nouveau):not(.important) .ico{color:var(--on-green)}
.txt{flex:1 1 280px;min-width:0;margin:0;color:var(--fg);line-height:1.45}
.kind{display:inline-block;margin-right:10px;padding:1px 10px;border-radius:999px;background:color-mix(in srgb,var(--c) 16%,transparent);color:var(--c);font-size:12px;text-transform:uppercase;letter-spacing:.06em;vertical-align:1px}
.ann.nouveau .kind{color:#2563eb}
.ann.important .kind{color:#b45309}
.msg{overflow-wrap:anywhere}
.lnk{flex:none;color:var(--c);font-weight:600;text-decoration:none;transition:transform .2s}
.lnk:hover{text-decoration:underline;transform:translateX(3px)}
.x{position:absolute;top:50%;right:10px;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;margin-top:-17px;border:0;border-radius:50%;background:transparent;color:var(--muted);font:400 24px/1 var(--font);cursor:pointer;transition:background .2s,color .2s,transform .2s}
.x:hover{background:color-mix(in srgb,var(--c) 14%,transparent);color:var(--fg);transform:rotate(90deg)}
.ann-enter-active{transition:opacity .5s ease,transform .5s cubic-bezier(.2,.8,.2,1)}
.ann-leave-active{transition:opacity .3s ease,transform .3s ease,max-height .35s ease,padding .35s ease;max-height:200px}
.ann-enter-from{opacity:0;transform:translateY(-12px)}
.ann-leave-to{opacity:0;transform:translateY(-8px);max-height:0;padding-top:0;padding-bottom:0}
@media (prefers-reduced-motion:reduce){.ann-enter-active,.ann-leave-active,.lnk,.x{transition:none}}
</style>
