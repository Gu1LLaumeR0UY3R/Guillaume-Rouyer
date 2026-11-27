<script setup>
// Page /cybersecurite : un mini-laboratoire pédagogique. Chaque outil est chargé à la demande (onglet ouvert).
// L'onglet actif vit dans l'adresse (?outil=jwt) : on peut partager un lien direct vers une démo.
import { computed, defineAsyncComponent, nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePageMeta } from '../composables/usePageMeta.js'
import '../components/cyber/lab.css'

const route = useRoute()
const router = useRouter()

const TOOLS = [
  { id: 'hash', label: 'Hachage', title: 'Hachage de mots de passe', comp: defineAsyncComponent(() => import('../components/cyber/HashLab.vue')),
    intro: "Un site sérieux ne stocke jamais un mot de passe : il stocke une empreinte. Mais toutes les empreintes ne se valent pas.",
    takeaway: "SHA-256 seul est trop rapide pour des mots de passe. On utilise un sel unique et une fonction lente (Argon2id, bcrypt, PBKDF2 avec beaucoup d'itérations)." },
  { id: 'mdp', label: 'Mots de passe', title: 'Robustesse des mots de passe', comp: defineAsyncComponent(() => import('../components/cyber/PasswordLab.vue')),
    intro: "Combien de temps faut-il à un attaquant pour trouver ton mot de passe ? Estimation 100 % locale, rien n'est transmis.",
    takeaway: "La longueur et l'imprévisibilité comptent plus que les symboles. Le mieux : un gestionnaire de mots de passe et un mot de passe unique par site." },
  { id: 'jwt', label: 'JWT', title: 'Fonctionnement et failles du JWT', comp: defineAsyncComponent(() => import('../components/cyber/JwtLab.vue')),
    intro: "Le JWT est partout dans les API. Lisible par tous, protégé uniquement par sa signature : voyons ce qui se passe quand on le falsifie.",
    takeaway: "Toujours vérifier la signature, imposer l'algorithme côté serveur (jamais celui du jeton), contrôler exp, et ne rien mettre de secret dans le contenu." },
  { id: 'sql', label: 'Injection SQL', title: "Démonstration d'injection SQL", comp: defineAsyncComponent(() => import('../components/cyber/SqliLab.vue')),
    intro: "Une page de connexion, une apostrophe, et toute la base s'ouvre. Compare le code vulnérable et la requête préparée.",
    takeaway: "Requêtes préparées (paramètres liés) partout, jamais de concaténation. Ce site, avec Cloudflare D1, n'utilise que des requêtes préparées." },
  { id: 'xss', label: 'XSS', title: 'Cross-Site Scripting (XSS)', comp: defineAsyncComponent(() => import('../components/cyber/XssLab.vue')),
    intro: "Quand un site réaffiche une saisie sans précaution, le code d'un attaquant s'exécute chez les autres visiteurs. Démo dans un cadre isolé.",
    takeaway: "Encoder en sortie (textContent), nettoyer le HTML avec une bibliothèque éprouvée, et ajouter une CSP stricte en seconde ligne de défense." },
  { id: 'headers', label: 'En-têtes HTTP', title: "Analyseur d'en-têtes HTTP de sécurité", comp: defineAsyncComponent(() => import('../components/cyber/HeadersLab.vue')),
    intro: "Quelques lignes dans la réponse du serveur suffisent à désarmer des familles entières d'attaques. Note le site de ton choix, ou celui-ci.",
    takeaway: "CSP, HSTS, nosniff, anti-clickjacking, Referrer-Policy : peu coûteux à mettre en place, très efficaces." },
  { id: '2fa', label: 'Double authentification', title: 'Double authentification (TOTP)', comp: defineAsyncComponent(() => import('../components/cyber/TotpLab.vue')),
    intro: "Le code à 6 chiffres de ton appli d'authentification n'a rien de magique : c'est un calcul. Comme celui qui protège l'administration de ce site.",
    takeaway: "Un second facteur bloque la plupart des vols de mots de passe. Limiter les essais reste indispensable (1 million de codes possibles)." },
]

const ids = TOOLS.map((t) => t.id)
const active = computed(() => TOOLS.find((t) => t.id === route.query.outil) ?? TOOLS[0])
const tabs = ref(null)

const select = (id) => router.replace({ path: '/cybersecurite', query: { outil: id } })
// Navigation au clavier d'une liste d'onglets : flèches, Début, Fin
async function onKey(e) {
  const i = ids.indexOf(active.value.id)
  const next = { ArrowRight: (i + 1) % ids.length, ArrowLeft: (i + ids.length - 1) % ids.length, Home: 0, End: ids.length - 1 }[e.key]
  if (next === undefined) return
  e.preventDefault()
  await select(ids[next]) // on attend le changement d'adresse avant de déplacer le focus
  await nextTick()
  tabs.value?.querySelector('[aria-selected=true]')?.focus()
}

const MEASURES = [
  ['En-têtes de sécurité', "CSP stricte (scripts du site uniquement), HSTS, nosniff, anti-clickjacking, COOP/CORP, Permissions-Policy."],
  ['Base de données', "Uniquement des requêtes préparées (Cloudflare D1) : l'injection SQL n'a pas de prise."],
  ['Administration', "Mot de passe de 14 caractères minimum + double authentification TOTP, essais limités, adresse verrouillée après des échecs répétés."],
  ['Formulaire de contact', "Défi anti-robot par preuve de travail signée, champ piège, limites de débit, plafond quotidien, adresses jetables refusées."],
  ['Requêtes sensibles', "Contrôle de l'origine (anti-CSRF) sur les actions qui modifient des données."],
  ['Journaux', "Secrets masqués et caractères de contrôle retirés (pas de fausses lignes de log), conservation limitée à 30 jours."],
  ['Code exécuté', "Les démos des articles tournent dans un iframe sandbox sans accès au site ni au réseau. Le contenu riche est nettoyé avant affichage."],
  ['Réaction', "Alertes, bannissement d'adresses ou de pays depuis l'admin, sauvegardes automatiques."],
]

usePageMeta(() => ({
  title: 'Laboratoire cybersécurité',
  description: "Mini-laboratoire interactif de Guillaume Rouyer : hachage, robustesse des mots de passe, JWT, injection SQL, XSS, en-têtes HTTP et double authentification, avec des démos exécutables.",
  canonical: '/cybersecurite',
}))
</script>

<template>
  <div class="cyber">
    <header class="hero">
      <div class="container">
        <p class="eyebrow"><span aria-hidden="true">$</span> cybersécurité --laboratoire</p>
        <h1>Comprendre les attaques pour <em>mieux les bloquer</em></h1>
        <p class="lead">Sept démos interactives que j'ai construites pour expliquer des notions de sécurité. Elles tournent dans ton navigateur : rien n'est envoyé, rien n'est stocké.</p>
        <ul class="facts" aria-label="En bref">
          <li><strong>7</strong> démos</li><li><strong>100 %</strong> local</li><li><strong>0</strong> donnée envoyée</li>
        </ul>
      </div>
    </header>

    <div class="container body" id="labo">
      <div ref="tabs" class="tabs" role="tablist" aria-label="Outils du laboratoire" @keydown="onKey">
        <button v-for="t in TOOLS" :id="`tab-${t.id}`" :key="t.id" class="tab" role="tab" type="button"
          :aria-selected="t.id === active.id" :aria-controls="`panel-${t.id}`" :tabindex="t.id === active.id ? 0 : -1" @click="select(t.id)"><span class="num" aria-hidden="true">{{ String(TOOLS.indexOf(t) + 1).padStart(2, '0') }}</span>{{ t.label }}</button>
      </div>

      <section :id="`panel-${active.id}`" class="panel" role="tabpanel" :aria-labelledby="`tab-${active.id}`">
        <h2>{{ active.title }}</h2>
        <p class="intro">{{ active.intro }}</p>
        <Suspense>
          <component :is="active.comp" :key="active.id" />
          <template #fallback><p class="lab-note" role="status">Chargement de la démo…</p></template>
        </Suspense>
        <aside class="takeaway"><span class="tk-label">À retenir</span><p>{{ active.takeaway }}</p></aside>
      </section>

      <section class="applied" aria-labelledby="applied-title">
        <h2 id="applied-title">Ce que j'applique sur ce site</h2>
        <p class="intro">Un portfolio est aussi une surface d'attaque. Voici les protections réellement en place ici.</p>
        <dl class="measures">
          <div v-for="[k, v] in MEASURES" :key="k"><dt>{{ k }}<span class="on">actif</span></dt><dd>{{ v }}</dd></div>
        </dl>
        <p class="lab-note">Tu peux le vérifier toi-même : l'onglet « En-têtes HTTP » analyse ce site en un clic.</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Bandeau d'en-tête toujours sombre : l'identité « terminal » du labo, en thème clair comme sombre */
.hero{position:relative;overflow:hidden;padding:72px 0 52px;background:#07140d;color:#e8f5ec;
  background-image:radial-gradient(60% 120% at 85% 0,rgba(57,255,136,.16),transparent 60%),linear-gradient(rgba(57,255,136,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(57,255,136,.06) 1px,transparent 1px);
  background-size:auto,44px 44px,44px 44px}
.hero .container{position:relative}
.eyebrow{margin:0 0 16px;color:#39ff88;font:600 14px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.04em}
.eyebrow span{margin-right:8px;opacity:.7}
h1{max-width:20ch;margin:0 0 16px;color:#fff;font-size:clamp(32px,5.4vw,56px);line-height:1.08}
h1 em{font-style:normal;color:#39ff88}
.lead{max-width:60ch;margin:0 0 26px;color:#b9d3c1;font-size:18px}
.facts{display:flex;flex-wrap:wrap;gap:10px;margin:0;padding:0;list-style:none}
.facts li{padding:8px 14px;border:1px solid rgba(57,255,136,.35);border-radius:999px;background:rgba(57,255,136,.08);color:#d6ecdc;font:500 14px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.facts strong{color:#39ff88}
.body{padding-top:0;padding-bottom:72px}
/* Onglets : une seule ligne qui défile sur mobile, collée sous l'en-tête du site */
.tabs{position:sticky;top:var(--header-h,66px);z-index:5;display:flex;gap:6px;margin:0 calc(-1 * clamp(20px,5vw,48px)) 32px;padding:12px clamp(20px,5vw,48px);overflow-x:auto;scrollbar-width:thin;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.tab{flex:none;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border:1px solid transparent;border-radius:10px;background:transparent;color:var(--muted);font:600 15px var(--font);cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}
.tab .num{color:var(--green);font:600 12px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;opacity:.8}
.tab:hover{color:var(--fg);background:color-mix(in srgb,var(--green) 10%,transparent)}
.tab[aria-selected=true]{border-color:var(--green);background:var(--green);color:var(--on-green)}
.tab[aria-selected=true] .num{color:inherit}
.tab:focus-visible{outline:3px solid var(--neon);outline-offset:2px}
.panel{display:grid;gap:18px;padding:0} /* la règle globale `section` ajoute 72 px : on l'annule */
.panel h2,.applied h2{margin:0;font-size:clamp(26px,3.6vw,36px)}
.intro{margin:0;max-width:70ch;color:var(--muted);font-size:17px}
.takeaway{display:grid;gap:6px;padding:18px 22px;border:1px solid color-mix(in srgb,var(--green) 40%,var(--line));border-radius:14px;background:color-mix(in srgb,var(--green) 8%,var(--card))}
.takeaway p{margin:0}
.tk-label{color:var(--green);font:700 12px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.12em;text-transform:uppercase}
.tk-label::before{content:'✓ '}
.applied{display:grid;gap:16px;margin-top:72px;padding:48px 0 0;border-top:1px solid var(--line)}
.measures{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:14px;margin:0}
.measures div{padding:18px 20px;border:1px solid var(--line);border-top:3px solid var(--green);border-radius:var(--radius);background:var(--card)}
.measures dt{display:flex;justify-content:space-between;gap:10px;align-items:center;font:600 16px var(--serif)}
.on{padding:2px 8px;border-radius:999px;background:color-mix(in srgb,var(--green) 16%,transparent);color:var(--green);font:600 11px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.06em;text-transform:uppercase}
.on::before{content:'';display:inline-block;width:6px;height:6px;margin-right:6px;border-radius:50%;background:currentColor}
.measures dd{margin:8px 0 0;color:var(--muted);font-size:15px}
@media (max-width:600px){.hero{padding:48px 0 36px}}
</style>
