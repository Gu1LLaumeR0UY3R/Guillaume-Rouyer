// Données des projets : modifier ce fichier suffit pour mettre à jour la section.
// Les projets « featured » apparaissent sur l'accueil et ont une page dédiée (voir projectDetails.js).
const GH = 'https://github.com/Gu1LLaumeR0UY3R'

// Adresse ouverte quand on clique sur un projet : le tableau SpiderNet s'ouvre directement, sans page intermédiaire.
export const projectLink = (p) => p.board || `/projets/${p.slug}`

export const TAGS = ['Tout', 'Web', 'Mobile', 'IA', 'API', '3D']

export const PROJECTS = [
  {
    slug: 'spidernet', featured: true, name: 'SpiderNet', tag: 'Web', status: 'En cours',
    accent: 'linear-gradient(135deg,#0b0b14,#1a1038 55%,#c4162a)',
    desc: "Signalement et suivi d'incidents urbains géolocalisés, inspiré de l'appli de Ganke. Rôles citoyen, héros et admin, SQL spatial PostGIS. Projet de fan non officiel.",
    stack: ['Symfony 7.4', 'PHP 8.3', 'PostgreSQL', 'PostGIS', 'Docker'], repo: `${GH}/Spider-net`,
    board: '/projets/spidernet/tableau',
  },
  {
    slug: 'goodnight', featured: true, name: 'Goodnight', tag: 'Web',
    accent: 'linear-gradient(135deg,#0f172a,#1e3a8a 60%,#f59e0b)',
    desc: 'Plateforme immobilière complète : MVC PHP, 3 rôles, KPI, FullCalendar, sécurité PDO et XSS. 174 commits.',
    stack: ['PHP', 'MySQL', 'JS', 'Chart.js', 'FullCalendar'], repo: `${GH}/Goodnight`,
  },
  {
    slug: 'teyvathubfr', featured: true, name: 'TeyvatHubFR', tag: 'Web', status: 'Page en maintenance',
    accent: 'linear-gradient(135deg,#0f3d3e,#1b6b6a 55%,#e8c56a)',
    desc: 'Site encyclopédique Genshin Impact : 2FA, admin CRUD, blog, PHPUnit, jeu Motus intégré.',
    stack: ['Laravel 12', 'Blade', 'Alpine.js', 'Tailwind CSS', 'PHPUnit'], repo: `${GH}/TeyvatHubFR`,
  },
  {
    slug: 'bataille-navale', featured: true, name: 'Bataille Navale', tag: '3D', status: 'Bientôt en ligne',
    accent: 'linear-gradient(135deg,#06324a,#0b6b8f 60%,#9be0f5)',
    desc: 'Bataille navale 3D : interface Vue.js, modèles 3D Babylon.js, interaction avec le serveur.',
    stack: ['Vue.js', 'Babylon.js', 'JavaScript', 'API'], repo: `${GH}/Bataille-Navale`,
  },
  {
    slug: 'goodnight-mobile', name: 'Goodnight Mobile', tag: 'Mobile',
    desc: 'App iOS, Android et Web : JWT Bearer, routes protégées, typage fort avec ApiResponse générique.',
    stack: ['React Native', 'Expo', 'TypeScript', 'JWT', 'SecureStore'], repo: `${GH}/Goodnight-Mobile-Apps`,
  },
  {
    slug: 'echo', name: 'Echo, IA locale', tag: 'IA',
    desc: 'IA auto-hébergée sur Proxmox, Qwen via Ollama, synthèse vocale personnalisée.',
    stack: ['Python', 'Ollama', 'Proxmox', 'Linux'], repo: `${GH}/Echo`,
  },
  {
    slug: 'owasys-mail-api', name: 'API OWASYS + Mail API', tag: 'API',
    desc: 'Simulation IoT de boîtiers TRKF et API e-mail sécurisée (Jinja2, envoi en masse, hash éphémère).',
    stack: ['Python', 'FastAPI', 'Jinja2', 'IoT'], repo: null, note: 'Code privé (projet de stage).',
  },
  {
    slug: 'logs-cleaner-nmea', name: 'LOGS-CLEANER + NMEA', tag: 'API',
    desc: 'Script CRON de nettoyage de logs et application desktop émettant des trames NMEA sur port série.',
    stack: ['Python', 'CRON', 'PySimpleGUI', 'pyserial'], repo: null, note: 'Code privé (projet de stage).',
  },
]
