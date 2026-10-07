# DevSecOps Portfolio – Amal Jemli

Dépôt GitHub : https://github.com/Amal356/cv-devsecops

Le mini CV de l'étape 5 a évolué en petite application de portfolio (HTML5, CSS3, JavaScript).

## Étape 5 – Mini CV One Page

![Mini CV](screenshots/01-cv.png)

## Étape 7 – Évolution vers un DevSecOps Portfolio

Sections : **About, Skills, DevSecOps Skills, Projects, Experience, Contact**.

Principales améliorations :

- barre de navigation fixe avec liens d'ancrage vers chaque section et défilement doux ;
- page découpée en sections au lieu d'un CV en deux colonnes ;
- thème clair / sombre, mémorisé dans le navigateur, qui suit aussi la préférence du système ;
- mise en page adaptée aux petits écrans (responsive) ;
- contenu des projets séparé de la mise en page, dans le code JavaScript.

![Portfolio](screenshots/02-portfolio.png)

## Étape 8 – Section DevSecOps Skills

Technologies du projet : Git, Docker, Jenkins, Kubernetes, Ansible, Terraform, Argo CD.
Git, Docker et Jenkins sont marqués « Pratiqué dans ce projet », les autres « Au programme ».

![DevSecOps Skills](screenshots/03-devsecops-skills.png)

## Étape 9 – Projects générés dynamiquement en JavaScript

Les projets sont décrits dans un tableau d'objets, puis la page est construite par une fonction :

```javascript
const projets = [
  {
    titre: "Plateforme d'analyse des réservations",
    periode: "2025 · Desert Navigation",
    description: "Analyse des réservations Airbnb et Booking ...",
    technologies: ["Python", "PostgreSQL", "React", "Node.js", "JWT"]
  },
  // ...
];

function creerProjet(p) {
  const bloc = document.createElement("article");
  const titre = document.createElement("h3");
  titre.textContent = p.titre;
  // ... description, technologies, lien
  bloc.append(titre /* ... */);
  return bloc;
}

document.getElementById("project-list").append(...projets.map(creerProjet));
```

Ajouter un projet revient à ajouter un objet au tableau.

![Projects](screenshots/04-projects.png)
