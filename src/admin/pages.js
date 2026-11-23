// Pages de contenu modifiables : titre, description et adresse de l'éditeur. Partagé par le hub Contenu et l'onglet Versions.
export const PAGES = [
  { key: 'home', title: 'Accueil', desc: "Titre, présentation et bouton de la page d'accueil", to: '/admin/contenu/pages?onglet=home' },
  { key: 'about', title: 'À propos', desc: 'Paragraphes de présentation et infos rapides', to: '/admin/contenu/pages?onglet=about' },
  { key: 'skills', title: 'Compétences', desc: 'Groupes de compétences et niveaux', to: '/admin/contenu/pages?onglet=skills' },
  { key: 'timeline', title: 'Parcours', desc: 'Formations et expériences', to: '/admin/contenu/pages?onglet=timeline' },
  { key: 'contact', title: 'Contact', desc: 'Titre et texte de la section contact', to: '/admin/contenu/pages?onglet=contact' },
  { key: 'legal', title: 'Mentions légales', desc: 'Page des mentions légales', to: '/admin/contenu/pages?onglet=legal' },
  { key: 'privacy', title: 'Confidentialité', desc: 'Page de politique de confidentialité', to: '/admin/contenu/pages?onglet=privacy' },
  { key: 'now', title: 'Maintenant', desc: 'Page « Maintenant » : ce que tu fais en ce moment', to: '/admin/contenu/pages?onglet=now' },
  { key: 'tools', title: 'Mes outils', desc: 'Page « Mes outils » : ton environnement de travail', to: '/admin/contenu/pages?onglet=tools' },
  { key: 'changelog', title: 'Changelog', desc: 'Journal des évolutions du portfolio et des projets', to: '/admin/contenu/pages?onglet=changelog' },
  { key: 'succes', title: 'Succès', desc: 'Noms, descriptions et icônes des succès du site', to: '/admin/contenu/succes' },
  { key: 'goodnight', title: 'Étude de cas Goodnight', desc: 'Bandeau, aperçu, étapes, technique et images', to: '/admin/contenu/goodnight' },
  { key: 'spidernet', title: 'Tableau SpiderNet', desc: "Cartes et colonnes du tableau d'enquête", to: '/admin/contenu/spidernet' },
]
export const pageByKey = (k) => PAGES.find((p) => p.key === k)
