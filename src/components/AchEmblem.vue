<script setup>
// Emblème de succès : losange à la couleur de la rareté, forme dessinée au trait. Verrouillé : silhouette grise et petit cadenas.
defineProps({ kind: String, rarity: { type: Number, default: 1 }, locked: Boolean, size: { type: Number, default: 48 } })
const SHAPES = {
  star: '<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  feather: '<path d="M20 4c-7 0-12 4-12 10v3m12-13c0 6-4 11-10 11M4 20l6-6M14 10h4"/>',
  moon: '<path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5z"/>',
  key: '<circle cx="8" cy="15" r="3.5"/><path d="m10.5 12.5 9-9M16 7l2.5 2.5M13.5 9.5 15.5 11.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  person: '<circle cx="12" cy="5" r="1.8"/><path d="M5 9l7 1.6L19 9M12 10.6V15m0 0-3 5.5M12 15l3 5.5"/>',
  sprout: '<path d="M12 21v-9M12 12C12 8 9 6 5 6c0 4 2 6 7 6zm0 2c0-3 2.5-5 7-5 0 3.5-2.5 5-7 5z"/>',
  doc: '<path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5"/>',
  terminal: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m7 10 3 2-3 2M12 15h5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  pad: '<rect x="3" y="7" width="18" height="10" rx="5"/><path d="M8 10v4M6 12h4M15.5 11h.01M17.5 13h.01"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
}
</script>

<template>
  <span class="emb" :class="['r' + rarity, { locked }]" :style="{ '--s': size + 'px' }" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="SHAPES[kind] ?? SHAPES.star" />
    <svg v-if="locked" class="lock" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V8a5 5 0 0 1 10 0v2h1.5v11h-13V10zm2 0h6V8a3 3 0 0 0-6 0z"/></svg>
  </span>
</template>

<style scoped>
.emb{--c1:#d9dce1;--c2:#a3a8b2;position:relative;flex:none;display:grid;place-items:center;width:var(--s);height:var(--s);color:#49443d}
.emb.r2{--c1:#b8dba9;--c2:#78a66a}
.emb.r3{--c1:#a9c8f0;--c2:#5b8fd1}
.emb.r4{--c1:#f1dca0;--c2:#c5a45d}
/* losange + liseré */
.emb::before{content:"";position:absolute;inset:12%;transform:rotate(45deg);border-radius:12%;background:linear-gradient(135deg,var(--c1),var(--c2));box-shadow:0 0 0 2px #fbf7ed,0 0 0 3.5px var(--c2)}
.emb>svg:first-child{position:relative;width:48%;height:48%}
.emb.locked::before{background:#d6d0c2;box-shadow:0 0 0 2px #ece6d8,0 0 0 3.5px #c4bcaa}
.emb.locked{color:#8f8878}
.emb.locked>svg:first-child{opacity:.55}
.lock{position:absolute;right:2%;bottom:2%;width:34%;height:34%;padding:3px;box-sizing:border-box;border-radius:50%;background:#49443d;color:#ece6d8}
</style>
