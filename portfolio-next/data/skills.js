// Copie locale des compétences : données de secours si l'API Express (GET /api/skills) est injoignable
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
  { nom: "Docker", role: "Conteneuriser le frontend Next.js et l'API Express, lancés avec Docker Compose.", pratique: true },
  { nom: "Jenkins", role: "Pipeline qui récupère, installe et construit le portfolio.", pratique: true },
  { nom: "Kubernetes", role: "Déployer une application Spring Boot sur K3S (Labs Jenkins).", pratique: true },
  { nom: "Ansible", role: "Installer des paquets et Docker sur les VM avec des playbooks.", pratique: true },
  { nom: "Terraform", role: "Décrire l'infrastructure en code.", pratique: false },
  { nom: "Argo CD", role: "Déployer en continu depuis Git.", pratique: false },
];
