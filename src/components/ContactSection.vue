<script setup>
import { links } from '../content/settings.js'
import { track } from '../stats.js'
import ContactForm from './ContactForm.vue'
import { contact, loadSite } from '../content/site.js'
import { pick } from '../i18n/index.js'

loadSite()
// Textes modifiés dans l'admin, sinon texte d'origine
const title = () => pick(contact.value, 'title') || 'Travaillons ensemble'
const text = () => pick(contact.value, 'text') || 'Un projet, une mission ou une simple question : écris-moi.'
</script>

<template>
  <section id="contact" class="contact" v-reveal>
    <div class="container">
      <h2>{{ title() }}</h2>
      <p>{{ text() }}</p>
      <div class="cta">
        <a
          v-for="l in links"
          :key="l.label"
          class="btn"
          :class="l.primary ? 'light' : 'outline'"
          :href="l.href"
          :rel="l.external ? 'noopener' : null"
          @click="track.click(l.kind)"
        >{{ l.label }}</a>
      </div>
      <ContactForm />
    </div>
  </section>
</template>

<style scoped>
.contact{display:flex;align-items:center;min-height:60vh;padding:64px 0;background:var(--deep);color:#f3fbf5;text-align:center}
.container{width:100%}
p{margin:0 0 28px;color:#b8d8c2}
.cta{display:flex;flex-wrap:wrap;gap:16px;justify-content:center}
.light{background:#39ff88;border-color:#39ff88;color:#052e16}
.outline{background:transparent;border-color:#b8d8c2;color:#f3fbf5}
</style>
