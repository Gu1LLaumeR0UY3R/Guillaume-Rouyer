// Textes d'origine des pages légales. Syntaxe : ligne vide = nouveau paragraphe, « - » = liste, [texte](adresse) = lien, [[mesure]] = bouton de refus de la mesure d'audience.
export const LEGAL_DEFAULT = {
  updated: '28 octobre 2026',
  sections: [
  {
    "title": "Éditeur du site",
    "body": "Guillaume Rouyer, personne physique, à titre personnel et non professionnel.\nContact : [gui.rouyer@gmail.com](mailto:gui.rouyer@gmail.com)\nDirecteur de la publication : Guillaume Rouyer.\n\nL'éditeur étant une personne physique non professionnelle, son adresse postale n'est pas publiée. Elle est communiquée à l'hébergeur, conformément à l'article 6 de la loi du 21 juin 2004 pour la confiance dans l'économie numérique."
  },
  {
    "title": "Hébergement",
    "body": "Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, États-Unis · [cloudflare.com](https://www.cloudflare.com)\n\nLe code source du site est publié sur [GitHub](https://github.com/Gu1LLaumeR0UY3R)."
  },
  {
    "title": "Propriété intellectuelle",
    "body": "Les textes, le code et la mise en page de ce site sont la propriété de Guillaume Rouyer, sauf mention contraire.\n\nSpiderNet et Teyvat Hub sont des projets de fan, non officiels et sans lien avec les ayants droit. Spider-Man et les marques associées appartiennent à leurs propriétaires respectifs (Marvel). Genshin Impact et ses éléments appartiennent à HoYoverse."
  },
  {
    "title": "Responsabilité",
    "body": "Les informations de ce site sont fournies à titre indicatif et peuvent contenir des erreurs ou être obsolètes. L'éditeur n'est pas responsable du contenu des sites externes vers lesquels pointent les liens (GitHub, LinkedIn…)."
  },
  {
    "title": "Droit applicable",
    "body": "Le site est soumis au droit français. Pour toute question ou signalement, écrire à l'adresse de contact ci-dessus."
  }
],
}

export const PRIVACY_DEFAULT = {
  updated: '22 novembre 2026',
  sections: [
  {
    "title": "En résumé",
    "body": "Ce site ne collecte de donnée personnelle que si tu m'écris avec le formulaire de contact (voir « Contact par e-mail et formulaire »). Sinon : pas de compte visiteur, pas de publicité. Il compte seulement, de façon anonyme et agrégée, combien de personnes viennent (voir « Mesure d'audience »). Un cookie d'audience n'est posé que si tu l'acceptes, et tu peux le refuser ou le retirer à tout moment avec le lien « Cookies » en bas de page."
  },
  {
    "title": "Ce que le site enregistre dans ton navigateur",
    "body": "Ton choix pour le cookie d'audience (accepté ou refusé), pour qu'il soit respecté pendant 13 mois, puis redemandé. Si tu acceptes, un cookie d'audience est aussi posé (voir « Cookie d'audience »). Si tu choisis de ne pas être compté, ce choix est gardé dans ton navigateur pour être respecté. Le choix du mode clair ou sombre n'est pas mémorisé : le site démarre toujours en mode clair."
  },
  {
    "title": "Mesure d'audience",
    "body": "Pour savoir si le site est consulté, il compte des visites de façon anonyme, sans cookie et sans identifiant. Il enregistre uniquement des compteurs par jour : les pages vues, le temps passé actif sur une page, le pays et le continent (déduits au moment de la visite, sans conserver ton adresse IP), le type d'appareil (ordinateur, mobile ou tablette), le site d'où tu viens, le thème clair ou sombre choisi, les clics sur les liens de contact et le nombre d'arbres plantés dans le décor. Sans ton accord, il n'y a aucune ligne par visiteur : personne ne peut être reconnu d'une visite à l'autre, et ces compteurs ne sont croisés avec aucune autre donnée. Ils servent uniquement à l'éditeur, sont conservés 13 mois, puis supprimés. Les robots sont exclus.\n\nTu peux refuser : le site respecte « Do Not Track » et « Global Privacy Control », et tu peux aussi cliquer ci-dessous.\n\n[[mesure]]"
  },
  {
    "title": "Cookie d'audience (avec ton accord)",
    "body": "Si tu acceptes la bannière, le site pose un cookie nommé « __Host-vid » qui contient un numéro choisi au hasard et le jour de ta première visite. Il sert uniquement à compter combien de visiteurs différents viennent chaque jour, et combien sont déjà venus avant. Il dure 13 mois au maximum (sans être prolongé), n'est lu que par ce site et n'est transmis à personne.\n\nLe serveur ne garde pas ce numéro : il n'en conserve qu'une empreinte valable pour la journée, effacée sous 3 jours, qui ne permet pas de te suivre d'un jour à l'autre. Si tu refuses, ou si tu retires ton accord avec le lien « Cookies » en bas de page, le cookie est effacé et plus aucun numéro n'est utilisé. Le site respecte aussi « Do Not Track » et « Global Privacy Control » : dans ce cas, aucun cookie n'est posé et la bannière n'apparaît pas."
  },
  {
    "title": "Journaux de sécurité",
    "body": "Lorsque le serveur du site est sollicité (notamment lors d'une tentative de connexion à l'espace d'administration, réservé à l'éditeur du site), il enregistre l'adresse IP, le pays, la date, la page demandée et le type de navigateur. Ces journaux servent uniquement à la sécurité du site (détecter et bloquer les tentatives d'intrusion), reposent sur l'intérêt légitime de l'éditeur et sont supprimés au bout de 30 jours.\n\nPour se protéger d'une attaque, l'éditeur peut bloquer l'accès au site à un pays, à un continent ou à une adresse IP. Une adresse IP n'est conservée dans ce but que le temps du blocage, 30 jours au maximum, puis effacée. Seuls le pays (déduit par l'hébergeur) et le nombre d'accès bloqués sont comptés, sans aucune adresse.\n\nUn cookie technique de session n'est créé que lors de la connexion à l'espace d'administration. Il est strictement nécessaire à son fonctionnement et ne concerne pas les visiteurs."
  },
  {
    "title": "Polices de caractères",
    "body": "Les polices sont hébergées avec le site. Aucune requête n'est envoyée à un service tiers de polices."
  },
  {
    "title": "Hébergement",
    "body": "Le site est hébergé par Cloudflare, qui traite des données techniques (adresse IP, date et pages demandées) pour délivrer et sécuriser le site. Ce traitement relève de Cloudflare, selon [sa propre politique de confidentialité](https://www.cloudflare.com/privacypolicy/)."
  },
  {
    "title": "Contact par e-mail et formulaire",
      "body": "Si tu m'écris par e-mail, j'utilise ton adresse et ton message uniquement pour te répondre.\n\nSi tu utilises le formulaire de contact, ton nom, ton adresse e-mail, ton éventuel sujet et ton message sont enregistrés sur le serveur du site, uniquement pour te répondre. Ils ne sont lus que par l'éditeur, dans son espace d'administration, et ne sont copiés nulle part ailleurs ni transmis à aucun tiers. Ils sont supprimés automatiquement au bout de 12 mois. Ton adresse IP n'est pas enregistrée avec le message.\n\nPour éviter les envois automatiques, le formulaire demande à ton navigateur de résoudre un petit calcul, sans cookie et sans service extérieur. Une vérification simple est faite sur ton adresse e-mail (forme, domaine existant, adresse jetable) ; elle interroge un service public de noms de domaine (Cloudflare) avec la partie après le « @ » seulement."
    },
  {
    "title": "Liens externes",
    "body": "Les liens vers GitHub, LinkedIn ou d'autres sites relèvent des politiques de confidentialité de ces services."
  },
  {
    "title": "Tes droits",
    "body": "Conformément au RGPD, tu peux demander l'accès, la rectification, l'effacement, la limitation ou la portabilité des données te concernant, et t'opposer à leur traitement, en écrivant à [gui.rouyer@gmail.com](mailto:gui.rouyer@gmail.com). Tu peux aussi introduire une réclamation auprès de la [CNIL](https://www.cnil.fr)."
  }
],
}
