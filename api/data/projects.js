// Données des projets, renvoyées par GET /api/projects et GET /api/projects/:slug
export const projects = [
  {
    slug: "analyse-reservations",
    titre: "Plateforme d'analyse des réservations",
    periode: "2025 · Desert Navigation",
    description:
      "Analyse des réservations Airbnb et Booking : import de fichiers Excel, traitement avec Python, tableau de bord React, authentification JWT et prédiction simple des tendances.",
    details: [
      "Import et nettoyage des fichiers Excel exportés depuis Airbnb et Booking avec Python.",
      "Stockage des réservations dans une base PostgreSQL.",
      "API Node.js protégée par authentification JWT.",
      "Tableau de bord React : taux d'occupation, revenus, tendances par période.",
    ],
    technologies: ["Python", "PostgreSQL", "React", "Node.js", "JWT"],
  },
  {
    slug: "site-films-series",
    titre: "Site de films et séries",
    periode: "2023 · Société Itqan",
    description:
      "Site dynamique pour visualiser et télécharger des films et séries, avec interfaces responsives et gestion des fichiers multimédias côté serveur.",
    details: [
      "Interfaces responsives en HTML, CSS et JavaScript.",
      "Catalogue de films et séries avec fiches détaillées.",
      "Gestion des fichiers multimédias côté serveur en PHP.",
    ],
    technologies: ["HTML5", "CSS3", "JavaScript", "PHP"],
  },
  {
    slug: "infrastructure-devops",
    titre: "Infrastructure DevOps sur machine virtuelle",
    periode: "2026 · Master DevOps et Cloud Computing",
    description:
      "Serveur Ubuntu avec accès SSH par clé, Docker et Jenkins installés en service, configuration automatisée avec Ansible, portfolio Next.js alimenté par une API Express et lancé avec Docker Compose.",
    details: [
      "Ubuntu Server 26.04 sous VirtualBox, accès SSH par clé et pare-feu UFW.",
      "Docker et Jenkins installés en tant que services.",
      "Portfolio servi par Nginx dans un conteneur, déployé avec Docker Compose.",
      "Création automatique de VM avec Vagrant (Infrastructure as Code).",
      "Migration du portfolio vers Next.js et premier pipeline Jenkins.",
      "Configuration des VM automatisée avec Ansible (paquets et Docker).",
      "API Node.js / Express qui fournit les données du portfolio, frontend et API lancés avec Docker Compose.",
    ],
    technologies: ["Ubuntu Server", "SSH", "Docker", "Jenkins", "Vagrant", "Ansible", "Next.js", "Express"],
    lien: "https://github.com/Amal356/cv-devsecops",
  },
];

// Recherche d'un projet à partir de son slug (utilisé par /projects/[slug])
export function getProject(slug) {
  return projects.find((p) => p.slug === slug);
}
