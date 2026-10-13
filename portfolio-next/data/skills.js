// Compétences générales, regroupées par catégorie
export const skills = [
  {
    categorie: "Développement",
    items: ["HTML5", "CSS3", "JavaScript", "React", "Next.js", "Angular", "Flutter", "Node.js", "Express.js", "Flask", "Spring Boot", "PostgreSQL", "MySQL"],
  },
  {
    categorie: "Cloud et outils",
    items: ["Linux", "Bash", "GitHub Actions", "GitLab CI", "AWS / Azure (notions)", "Prometheus", "Grafana"],
  },
];

// Technologies DevSecOps du projet : pratique = true si utilisée dans les TP
export const devsecopsSkills = [
  { nom: "Git", role: "Versionner le code et publier sur GitHub en SSH.", pratique: true },
  { nom: "Docker", role: "Empaqueter le portfolio dans une image Nginx.", pratique: true },
  { nom: "Jenkins", role: "Pipeline qui récupère, installe et construit le portfolio.", pratique: true },
  { nom: "Kubernetes", role: "Orchestrer des conteneurs.", pratique: false },
  { nom: "Ansible", role: "Configurer des serveurs de façon reproductible.", pratique: false },
  { nom: "Terraform", role: "Décrire l'infrastructure en code.", pratique: false },
  { nom: "Argo CD", role: "Déployer en continu depuis Git.", pratique: false },
];
