<script setup>
import { ref } from 'vue'
import LegalLayout from '../components/LegalLayout.vue'
import { isOptedOut, optOutStored, setOptOut } from '../stats.js'

const off = ref(optOutStored())
const auto = isOptedOut() && !off.value // « Do Not Track » ou « Global Privacy Control » déjà actifs dans ton navigateur
function toggleOff() { off.value = !off.value; setOptOut(off.value) }
</script>

<template>
  <LegalLayout title="Politique de confidentialité" updated="18 novembre 2026">
    <h2>En résumé</h2>
    <p>
      Ce site ne collecte aucune donnée personnelle par lui-même : pas de compte visiteur, pas de cookie pour les visiteurs,
      pas de publicité. Il compte seulement, de façon anonyme et agrégée, combien de personnes viennent (voir « Mesure d'audience »),
      et tu peux le refuser en un clic.
    </p>

    <h2>Ce que le site enregistre dans ton navigateur</h2>
    <p>
      Rien, sauf si tu choisis de ne pas être compté (voir ci-dessous) : ce choix est alors gardé dans ton navigateur pour être respecté.
      Le choix du mode clair ou sombre n'est pas mémorisé : le site démarre toujours en mode clair.
    </p>

    <h2>Mesure d'audience</h2>
    <p>
      Pour savoir si le site est consulté, il compte des visites de façon anonyme, sans cookie et sans identifiant. Il enregistre
      uniquement des compteurs par jour : les pages vues, le temps passé actif sur une page, le pays et le continent
      (déduits au moment de la visite, sans conserver ton adresse IP), le type d'appareil (ordinateur, mobile ou tablette), le site d'où tu viens,
      le thème clair ou sombre choisi, les clics sur les liens de contact et le nombre d'arbres plantés dans le décor.
      Il n'y a aucune ligne par visiteur : personne ne peut être reconnu d'une visite à l'autre, et ces compteurs ne sont croisés avec aucune autre donnée.
      Ils servent uniquement à l'éditeur, sont conservés 13 mois, puis supprimés. Les robots sont exclus.
    </p>
    <p>
      Tu peux refuser : le site respecte « Do Not Track » et « Global Privacy Control », et tu peux aussi cliquer ci-dessous.
      <span v-if="auto"> Ton navigateur envoie déjà ce refus : tu n'es pas compté.</span>
    </p>
    <p>
      <button class="btn btn-ghost" type="button" :aria-pressed="off" @click="toggleOff">
        {{ off ? 'Je ne suis pas compté (cliquer pour accepter)' : 'Ne pas me compter' }}
      </button>
    </p>

    <h2>Journaux de sécurité</h2>
    <p>
      Lorsque le serveur du site est sollicité (notamment lors d'une tentative de connexion à l'espace d'administration,
      réservé à l'éditeur du site), il enregistre l'adresse IP, le pays, la date, la page demandée et le type de navigateur.
      Ces journaux servent uniquement à la sécurité du site (détecter et bloquer les tentatives d'intrusion), reposent sur
      l'intérêt légitime de l'éditeur et sont supprimés au bout de 30 jours.
    </p>
    <p>
      Un cookie technique de session n'est créé que lors de la connexion à l'espace d'administration. Il est
      strictement nécessaire à son fonctionnement et ne concerne pas les visiteurs.
    </p>

    <h2>Polices de caractères</h2>
    <p>Les polices sont hébergées avec le site. Aucune requête n'est envoyée à un service tiers de polices.</p>

    <h2>Hébergement</h2>
    <p>
      Le site est hébergé par Cloudflare, qui traite des données techniques (adresse IP, date et pages demandées)
      pour délivrer et sécuriser le site. Ce traitement relève de Cloudflare, selon
      <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener">sa propre politique de confidentialité</a>.
    </p>

    <h2>Contact par e-mail</h2>
    <p>
      Si tu m'écris, j'utilise ton adresse et ton message uniquement pour te répondre. Ils sont conservés le temps
      nécessaire à l'échange et ne sont transmis à aucun tiers.
    </p>

    <h2>Liens externes</h2>
    <p>Les liens vers GitHub, LinkedIn ou d'autres sites relèvent des politiques de confidentialité de ces services.</p>

    <h2>Tes droits</h2>
    <p>
      Conformément au RGPD, tu peux demander l'accès, la rectification, l'effacement, la limitation ou la portabilité
      des données te concernant, et t'opposer à leur traitement, en écrivant à
      <a href="mailto:gui.rouyer@gmail.com">gui.rouyer@gmail.com</a>. Tu peux aussi introduire une réclamation auprès de la
      <a href="https://www.cnil.fr" target="_blank" rel="noopener">CNIL</a>.
    </p>
  </LegalLayout>
</template>
