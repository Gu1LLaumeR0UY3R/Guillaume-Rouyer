<script setup>
import LegalLayout from '../components/LegalLayout.vue'
</script>

<template>
  <LegalLayout title="Politique de confidentialité" updated="12 novembre 2026">
    <h2>En résumé</h2>
    <p>
      Ce site ne collecte aucune donnée personnelle par lui-même : pas de compte visiteur, pas de formulaire, pas de cookie
      pour les visiteurs, pas de mesure d'audience, pas de publicité.
    </p>

    <h2>Ce que le site enregistre dans ton navigateur</h2>
    <p>Rien. Le choix du mode clair ou sombre n'est pas mémorisé : le site démarre toujours en mode clair.</p>

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
