<script setup>
// Texte simple des pages légales, rendu sans HTML brut : paragraphes (ligne vide), listes (lignes commençant par « - »),
// liens [texte](adresse) limités à https, mailto et pages du site. `[[mesure]]` insère le bouton de refus de la mesure d'audience.
import { computed } from 'vue'

const props = defineProps({ body: { type: String, default: '' } })
const LINK = /\[([^\]]*)\]\(([^)]*)\)/g
const SAFE = /^(https:\/\/\S+|mailto:[^\s@]+@[^\s@]+|\/(?![/\\])\S*)$/

function inline(line) {
  const out = []
  let last = 0
  for (const m of line.matchAll(LINK)) {
    if (m.index > last) out.push({ text: line.slice(last, m.index) })
    const href = m[2].trim()
    out.push(SAFE.test(href) ? { text: m[1] || href, href, kind: href.startsWith('/') ? 'route' : href.startsWith('mailto:') ? 'mail' : 'ext' } : { text: m[1] })
    last = m.index + m[0].length
  }
  if (last < line.length) out.push({ text: line.slice(last) })
  return out
}

const blocks = computed(() => props.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => {
  if (p === '[[mesure]]') return { type: 'widget' }
  const lines = p.split('\n').map((l) => l.trim())
  if (lines.every((l) => l.startsWith('- '))) return { type: 'ul', items: lines.map((l) => inline(l.slice(2))) }
  return { type: 'p', lines: lines.map(inline) }
}))
</script>

<template>
  <div class="rt">
    <template v-for="(b, i) in blocks" :key="i">
      <slot v-if="b.type === 'widget'" name="widget" />
      <ul v-else-if="b.type === 'ul'">
        <li v-for="(it, k) in b.items" :key="k"><template v-for="(s, j) in it" :key="j"><RouterLink v-if="s.kind === 'route'" :to="s.href">{{ s.text }}</RouterLink><a v-else-if="s.href" :href="s.href" :target="s.kind === 'ext' ? '_blank' : null" :rel="s.kind === 'ext' ? 'noopener' : null">{{ s.text }}</a><template v-else>{{ s.text }}</template></template></li>
      </ul>
      <p v-else>
        <template v-for="(line, l) in b.lines" :key="l"><br v-if="l"><template v-for="(s, j) in line" :key="j"><RouterLink v-if="s.kind === 'route'" :to="s.href">{{ s.text }}</RouterLink><a v-else-if="s.href" :href="s.href" :target="s.kind === 'ext' ? '_blank' : null" :rel="s.kind === 'ext' ? 'noopener' : null">{{ s.text }}</a><template v-else>{{ s.text }}</template></template></template>
      </p>
    </template>
  </div>
</template>

<style scoped>
p,li{color:var(--muted)}
p{margin:0 0 1em}
ul{padding-left:22px}
a{color:var(--green)}
</style>
