// Portfolio – version 2 (générée par le template Backstage portfolio-nextjs-evolution)
import ThemeToggle from "./ThemeToggle";

const competences = ["Linux", "Docker", "Kubernetes", "Helm", "Argo CD", "Terraform", "Jenkins", "Next.js"];

const certifications = [
  { nom: "Docker Certified Associate (préparation)", organisme: "Docker", annee: "2026" },
  { nom: "Certified Kubernetes Administrator – CKA (préparation)", organisme: "CNCF / Linux Foundation", annee: "2026" },
  { nom: "AWS Cloud Practitioner (préparation)", organisme: "Amazon Web Services", annee: "2026" },
];

const projets = [
  { titre: "Pipeline DevSecOps", texte: "Jenkins et GitHub Actions : tests, Gitleaks, Semgrep, Trivy, SBOM, signature Cosign." },
  { titre: "GitOps avec Argo CD", texte: "Environnements dev, staging et prod sur K3s, promotion de la même image signée." },
  { titre: "Infrastructure as Code", texte: "Terraform, OpenTofu et Ansible sur un cloud local (Floci)." },
  { titre: "Plateforme Backstage", texte: "Portail développeur : création, build, publication et déploiement en un formulaire." },
];

export default function Accueil() {
  return (
    <main>
      <header>
        <div>
          <h1>${{ values.fullName }}</h1>
          <p className="titre">${{ values.jobTitle }}</p>
          <p className="contact">Contact : ${{ values.email }}</p>
        </div>
        <ThemeToggle />
      </header>

      <section>
        <h2>Compétences</h2>
        <ul className="badges">
          {competences.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </section>

      <section>
        <h2>Certifications</h2>
        <ul className="cartes">
          {certifications.map((c) => (
            <li key={c.nom}><strong>{c.nom}</strong><span>{c.organisme} – {c.annee}</span></li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Projets DevOps &amp; Cloud</h2>
        <ul className="cartes">
          {projets.map((p) => (
            <li key={p.titre}><strong>{p.titre}</strong><span>{p.texte}</span></li>
          ))}
        </ul>
      </section>

      <footer>Version {process.env.APP_VERSION || "dev"} – déployée par Backstage</footer>
    </main>
  );
}
