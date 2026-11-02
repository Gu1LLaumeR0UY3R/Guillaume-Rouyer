// Contenu de la page d'étude de cas Goodnight.
// Les images se déposent dans src/assets/goodnight/ (voir le README de ce dossier).
export const REPO = 'https://github.com/Gu1LLaumeR0UY3R/Goodnight'

export const HERO = {
  kicker: 'Projet de portfolio',
  title: 'Goodnight',
  tagline: 'Louer, réserver, gérer : une plateforme, trois espaces.',
  text: "Une plateforme de location de biens immobiliers pensée pour trois points de vue : le locataire qui cherche, le propriétaire qui gère, l'administrateur qui valide.",
  meta: ['Développement', '2025', 'En binôme'],
}

export const INTRO = {
  kicker: 'Aperçu du projet',
  title: 'Une plateforme de location, du premier clic à la gestion.',
  paragraphs: [
    "Goodnight est une application web de location de biens, écrite en PHP avec une architecture MVC maison. Le travail porte sur la clarté du parcours de réservation, mais aussi sur ce qu'on voit rarement : l'espace du propriétaire (calendrier, tarifs, statistiques) et la validation des annonces par un administrateur.",
    'Projet réalisé en binôme : 174 commits au total, dont une centaine de ma main. Une application mobile en React Native complète la version web.',
  ],
  stack: ['PHP', 'MySQL', 'JavaScript', 'FullCalendar', 'Chart.js', 'Mapbox GL JS'],
}

export const STEPS = [
  { n: '01', icon: 'search', title: 'Explorer', text: 'Recherche par commune, type de bien et dates, puis visualisation des biens sur une carte.' },
  { n: '02', icon: 'calendar', title: 'Consulter', text: 'Fiche détaillée : photos, tarifs par saison, commentaires et notes des locataires, favoris.' },
  { n: '03', icon: 'key', title: 'Réserver', text: 'Choix des dates, réservation en ligne, historique et annulation. Le propriétaire est notifié.' },
]

export const FOCUS = {
  kicker: 'En images',
  title: 'Les écrans qui comptent.',
  text: 'Les composants les plus aboutis, vus depuis chaque espace.',
  items: [
    { slot: 'calendrier', role: 'Propriétaire', title: 'Calendrier', alt: 'Calendrier des réservations du propriétaire', more: 'Réservations et blocages de dates sur un calendrier FullCalendar, avec des tarifs par saison.' },
    { slot: 'tableau-de-bord', role: 'Propriétaire', title: 'Tableau de bord', alt: 'Tableau de bord avec indicateurs et graphiques', more: 'KPI et graphiques de réservations et de revenus : deux courbes superposées, deux axes, période au choix.' },
    { slot: 'notifications', role: 'Tous les espaces', title: 'Notifications', alt: 'Cloche et panneau de notifications', more: 'Une cloche et un compteur : chaque événement lié à une réservation prévient les personnes concernées.' },
    { slot: 'validation', role: 'Administrateur', title: 'Validation des biens', alt: "Liste des biens en attente de validation", more: "L'administrateur valide ou refuse chaque annonce. Une modification critique remet le bien en attente." },
  ],
}

export const TECH = {
  kicker: 'Réalisation technique',
  title: 'Prévenir les bonnes personnes, au bon moment.',
  challenge: [
    "Quand un propriétaire supprime un bien, tous les locataires qui avaient une réservation à venir doivent être prévenus, sans alourdir le reste de l'application.",
    "La solution retenue : centraliser cela dans le modèle de notifications. Les contrôleurs appellent une seule méthode, qui retrouve les locataires concernés avec une requête préparée et écrit une notification pour chacun. Le navigateur interroge ensuite un compteur toutes les 30 secondes pour allumer la cloche.",
  ],
  stack: ['PHP 7.4+', 'MVC maison', 'PDO', 'MySQL', 'JavaScript', 'FullCalendar', 'Chart.js', 'Mapbox GL JS'],
  codeTitle: 'Extrait simplifié de NotificationModel.php',
  code: `public function notifyUsersWithFutureReservationsForBien($id_biens, $title, $message, $link = null) {
    $sql = "SELECT DISTINCT r.id_locataire FROM reservations r
            WHERE r.id_biens = :id_biens AND r.date_fin >= CURDATE()";
    $stmt = $this->db->prepare($sql);
    $stmt->execute(['id_biens' => $id_biens]);

    foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $uid) {
        $this->create([
            'user_id' => (int) $uid,
            'type' => 'bien_change',
            'title' => $title,
            'message' => $message,
            'link' => $link,
        ]);
    }
}`,
  note: 'Limites assumées : un compteur interrogé toutes les 30 secondes plutôt que du temps réel (WebSocket), et pas encore de tests automatisés.',
}

export const CTA = {
  title: 'Envie de voir le code ?',
  text: "Goodnight est un projet de démonstration : il n'y a pas de version en ligne pour l'instant. Le code est public sur GitHub.",
}
