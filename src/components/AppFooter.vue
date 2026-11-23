<script setup>
import { openCv } from '../content/cvGate.js'
import { links, settings } from '../content/settings.js'
import { track } from '../stats.js'
import { reopenBanner } from '../consent.js'
import { t } from '../i18n/index.js'
</script>

<template>
  <footer class="site-footer">
    <div class="container">
      <aside class="contact-box" aria-label="Me contacter">
        <p class="title">Me contacter</p>
        <ul>
          <li v-for="l in links" :key="l.label">
            <a :href="l.href" :target="l.external ? '_blank' : null" :rel="l.external ? 'noopener' : null" @click="l.cv ? (($event.preventDefault(), openCv())) : track.click(l.kind)">{{ l.label }}</a>
          </li>
        </ul>
      </aside>
      <div class="bottom">
        <p>{{ settings.footerText }}</p>
        <nav aria-label="Le site">
          <RouterLink to="/maintenant">Maintenant</RouterLink>
          <RouterLink to="/outils">Mes outils</RouterLink>
          <RouterLink to="/changelog">Changelog</RouterLink>
        </nav>
        <nav aria-label="Informations légales">
          <RouterLink to="/mentions-legales">Mentions légales</RouterLink>
          <RouterLink to="/confidentialite">Confidentialité</RouterLink>
          <button type="button" class="lk" @click="reopenBanner">{{ t('cookie.manage') }}</button>
        </nav>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer{padding:40px 0 24px;border-top:1px solid var(--line);color:var(--muted);font-size:14px}
.container{display:flex;flex-direction:column;gap:28px;align-items:center}
.contact-box{width:100%;max-width:560px;padding:20px 24px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);text-align:center}
.title{margin:0 0 12px;color:var(--fg);font:600 18px var(--serif)}
ul{display:flex;flex-wrap:wrap;gap:10px 20px;justify-content:center;margin:0;padding:0;list-style:none}
ul a{color:var(--green);font-weight:600;text-decoration:none}
ul a:hover{text-decoration:underline}
.bottom{display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;justify-content:center}
.bottom p{margin:0}
nav{display:flex;gap:20px}
nav a{text-decoration:none}
nav .lk{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
nav .lk:hover,nav a:hover{color:var(--green);text-decoration:underline}
</style>
