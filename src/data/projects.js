// Données des projets : modifier ce fichier suffit pour mettre à jour la section.
const GH = 'https://github.com/Gu1LLaumeR0UY3R'

export const TAGS = ['Tout', 'Web', 'Mobile', 'IA', 'API', '3D']

export const PROJECTS = [
  {
    name: 'Goodnight', tag: 'Web',
    desc: 'Plateforme immobilière complète : MVC PHP, 3 rôles, KPI, FullCalendar, sécurité PDO et XSS. 174 commits.',
    stack: ['PHP', 'MySQL', 'JS', 'Chart.js', 'FullCalendar'], repo: `${GH}/Goodnight`,
  },
  {
    name: 'SpiderNet', tag: 'Web', status: 'En cours',
    desc: "Signalement et suivi d'incidents urbains géolocalisés, inspiré de l'appli de Ganke. Rôles citoyen, héros et admin, SQL spatial PostGIS. Projet de fan non officiel.",
    stack: ['Symfony 7.4', 'PHP 8.3', 'PostgreSQL', 'PostGIS', 'Docker'], repo: `${GH}/Spider-net`,
  },
  {
    name: 'TeyvatHubFR', tag: 'Web',
    desc: 'Site encyclopédique Genshin Impact : 2FA, admin CRUD, blog, PHPUnit, jeu Motus intégré.',
    stack: ['Laravel 12', 'Blade', 'Alpine.js', 'Tailwind CSS', 'PHPUnit'], repo: `${GH}/TeyvatHubFR`,
  },
  {
    name: 'Bataille Navale', tag: '3D', status: 'Bientôt en ligne',
    desc: 'Bataille navale 3D : interface Vue.js, modèles 3D Babylon.js, interaction avec le serveur.',
    stack: ['Vue.js', 'Babylon.js', 'JavaScript', 'API'], repo: `${GH}/Bataille-Navale`,
  },
  {
    name: 'Goodnight Mobile', tag: 'Mobile',
    desc: 'App iOS, Android et Web : JWT Bearer, routes protégées, typage fort avec ApiResponse générique.',
    stack: ['React Native', 'Expo', 'TypeScript', 'JWT', 'SecureStore'], repo: `${GH}/Goodnight-Mobile-Apps`,
  },
  {
    name: 'Echo, IA locale', tag: 'IA',
    desc: 'IA auto-hébergée sur Proxmox, Qwen via Ollama, synthèse vocale personnalisée.',
    stack: ['Python', 'Ollama', 'Proxmox', 'Linux'], repo: `${GH}/Echo`,
  },
  {
    name: 'API OWASYS + Mail API', tag: 'API',
    desc: 'Simulation IoT de boîtiers TRKF et API e-mail sécurisée (Jinja2, envoi en masse, hash éphémère).',
    stack: ['Python', 'FastAPI', 'Jinja2', 'IoT'], repo: null, note: 'Code privé (projet de stage).',
  },
  {
    name: 'LOGS-CLEANER + NMEA', tag: 'API',
    desc: 'Script CRON de nettoyage de logs et application desktop émettant des trames NMEA sur port série.',
    stack: ['Python', 'CRON', 'PySimpleGUI', 'pyserial'], repo: null, note: 'Code privé (projet de stage).',
  },
]
