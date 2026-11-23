// Textes de départ des pages « Maintenant », « Mes outils » et « Changelog » (modifiables dans l'admin, onglet Contenu).
export const NOW_DEFAULT = {
  updated: 'Novembre 2026',
  sections: [
    { title: 'Ce que je fais en ce moment', body: "- Je poursuis mon Bachelor Concepteur Développeur d'Applications (Full Stack & Cybersécurité) en alternance.\n- Je fais évoluer ce portfolio : espace d'administration, éditeur d'articles, accessibilité.\n- Je continue mon assistant IA local, auto-hébergé sur mon serveur Proxmox." },
    { title: 'Ce que j\'apprends', body: "- La sécurité des applications web : authentification, en-têtes, limites de débit.\n- Les bases de données et le déploiement sur Cloudflare.\n- De nouveaux langages, par curiosité." },
    { title: 'Me contacter', body: "Une question ou une idée ? [Écris-moi](/#contact)." },
  ],
}

export const TOOLS_DEFAULT = {
  updated: 'Novembre 2026',
  sections: [
    { title: 'Langages', body: "- PHP, JavaScript, Python\n- SQL (MySQL, SQLite)" },
    { title: 'Frameworks et bibliothèques', body: "- Laravel, Vue 3, FastAPI\n- Vite" },
    { title: 'Outils au quotidien', body: "- Git et GitHub\n- Docker\n- Linux" },
    { title: 'Mon serveur', body: "Un serveur Proxmox à la maison, qui héberge mes tests et mon assistant IA local." },
  ],
}

export const CHANGELOG_DEFAULT = {
  updated: 'Novembre 2026',
  sections: [
    { title: 'Novembre 2026 · Palette de commandes, succès et mode terminal', body: "- Ajout d'une palette de commandes (Ctrl + K).\n- Ajout des succès à débloquer et d'un mode terminal.\n- Nouvelles pages « Maintenant », « Mes outils » et ce journal." },
    { title: 'Novembre 2026 · CV et accessibilité', body: "- CV téléchargeable, protégé par trois petits défis anti-robot.\n- Panneau d'accessibilité : taille du texte, contraste, espacement, animations.\n- Nouveau titre : développeur full stack et cybersécurité." },
    { title: 'Novembre 2026 · Veille et administration', body: "- Éditeur visuel pour les articles de veille.\n- Versions, brouillons et publication programmée.\n- Recherche et tri dans la veille." },
  ],
}
