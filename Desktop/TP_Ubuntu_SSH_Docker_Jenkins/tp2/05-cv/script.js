// ---------- Projets : générés à partir d'un tableau d'objets ----------
const projets = [
  {
    titre: "Plateforme d'analyse des réservations",
    periode: "2025 · Desert Navigation",
    description: "Analyse des réservations Airbnb et Booking : import de fichiers Excel, traitement avec Python, tableau de bord React, authentification JWT et prédiction simple des tendances.",
    technologies: ["Python", "PostgreSQL", "React", "Node.js", "JWT"]
  },
  {
    titre: "Site de films et séries",
    periode: "2023 · Société Itqan",
    description: "Site dynamique pour visualiser et télécharger des films et séries, avec interfaces responsives et gestion des fichiers multimédias côté serveur.",
    technologies: ["HTML5", "CSS3", "JavaScript", "PHP"]
  },
  {
    titre: "Infrastructure DevOps sur machine virtuelle",
    periode: "2026 · Master DevOps et Cloud Computing",
    description: "Serveur Ubuntu avec accès SSH par clé, Docker et Jenkins installés en service, portfolio versionné sur GitHub puis conteneurisé avec Nginx.",
    technologies: ["Ubuntu Server", "SSH", "Docker", "Jenkins", "Git", "Nginx"],
    lien: "https://github.com/Amal356/cv-devsecops"
  }
];

function creerProjet(p) {
  const bloc = document.createElement("article");
  bloc.className = "project";

  const titre = document.createElement("h3");
  titre.textContent = p.titre;

  const periode = document.createElement("p");
  periode.className = "meta";
  periode.textContent = p.periode;

  const desc = document.createElement("p");
  desc.textContent = p.description;

  const tags = document.createElement("p");
  tags.className = "tags";
  p.technologies.forEach((t) => {
    const s = document.createElement("span");
    s.textContent = t;
    tags.appendChild(s);
  });

  bloc.append(titre, periode, desc, tags);

  if (p.lien) {
    const a = document.createElement("a");
    a.href = p.lien;
    a.textContent = "Voir le code sur GitHub";
    const wrap = document.createElement("p");
    wrap.appendChild(a);
    bloc.appendChild(wrap);
  }
  return bloc;
}

document.getElementById("project-list").append(...projets.map(creerProjet));

// ---------- Thème clair / sombre, mémorisé dans le navigateur ----------
const root = document.documentElement;
try {
  const saved = localStorage.getItem("theme");
  if (saved) root.dataset.theme = saved;
} catch (e) { /* stockage indisponible : on ignore */ }

document.getElementById("theme").addEventListener("click", () => {
  const sombre = getComputedStyle(root).getPropertyValue("--paper").trim() === "#0f1b17";
  const next = sombre ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (e) {}
});
