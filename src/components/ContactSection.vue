<script setup>
defineProps({ asPage: { type: Boolean, default: false } })
import { openCv } from '../content/cvGate.js'
import { ref } from 'vue'
import { links, settings } from '../content/settings.js'
import { track } from '../stats.js'
import ContactForm from './ContactForm.vue'
import { contact, loadSite } from '../content/site.js'
import { pick, t } from '../i18n/index.js'

loadSite()
// Textes modifiés dans l'admin, sinon texte d'origine
const title = () => pick(contact.value, 'title') || 'Travaillons ensemble'
// Copier l'adresse : le presse-papiers n'est autorisé que sur une page sécurisée et après un clic
const copyState = ref('') // '' | ok | fail
let copyTimer
async function copyEmail() {
  try { await navigator.clipboard.writeText(settings.value.contactEmail); copyState.value = 'ok' } catch { copyState.value = 'fail' }
  clearTimeout(copyTimer); copyTimer = setTimeout(() => { copyState.value = '' }, 3000)
}
const text = () => pick(contact.value, 'text') || 'Un projet, une mission ou une simple question : écris-moi.'
</script>

<template>
  <section id="contact" class="contact" v-reveal>
    <div class="container">
      <component :is="asPage ? 'h1' : 'h2'">{{ title() }}</component>
      <p>{{ text() }}</p>
      <div class="cta">
        <a
          v-for="l in links"
          :key="l.label"
          class="btn"
          :class="l.primary ? 'light' : 'outline'"
          :href="l.href"
          :rel="l.external ? 'noopener' : null"
          @click="l.cv ? (($event.preventDefault(), openCv())) : track.click(l.kind)"
        >{{ l.label }}</a>
        <button v-if="settings.contactEmail" class="btn outline" type="button" @click="copyEmail">{{ t('contact.copy') }}</button>
      </div>
      <p class="sr-live" role="status" :class="{ fail: copyState === 'fail' }">{{ copyState === 'ok' ? t('contact.copied') : copyState === 'fail' ? t('contact.copyFail') : '' }}</p>
      <ContactForm />
    </div>
  </section>
</template>

<style scoped>
.contact{display:flex;align-items:center;min-height:60vh;padding:64px 0;background:var(--deep);color:#f3fbf5;text-align:center}
.container{width:100%}
p{margin:0 0 28px;color:#b8d8c2}
.sr-live{min-height:1.6em;margin:12px 0 0;color:#8ff0b4;font-weight:600}.sr-live.fail{color:#ffb4a9}
.cta{display:flex;flex-wrap:wrap;gap:16px;justify-content:center}
.light{background:#39ff88;border-color:#39ff88;color:#052e16}
.outline{background:transparent;border-color:#b8d8c2;color:#f3fbf5}
</style>
