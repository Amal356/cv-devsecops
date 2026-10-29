import Link from "next/link";

// Carte d'un projet, réutilisée sur l'accueil et sur /projects
export default function ProjectCard({ projet }) {
  return (
    <article className="project">
      <h3><Link href={`/projects/${projet.slug}`}>{projet.titre}</Link></h3>
      <p className="meta">{projet.periode}</p>
      <p>{projet.description}</p>
      <p className="tags">
        {projet.technologies.map((t) => <span key={t}>{t}</span>)}
      </p>
      <p><Link href={`/projects/${projet.slug}`}>Voir le détail →</Link></p>
    </article>
  );
}
