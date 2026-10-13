import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, getProject } from "@/data/projects";

// Seuls les slugs du tableau existent : les autres renvoient une erreur 404
export const dynamicParams = false;

// Génère une page statique par projet au moment du build
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const projet = getProject(slug);
  return { title: projet ? `${projet.titre} – Amal Jemli` : "Projet introuvable" };
}

// Page /projects/<slug> : détail d'un projet
export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const projet = getProject(slug);
  if (!projet) notFound();

  return (
    <section className="detail">
      <p className="meta">{projet.periode}</p>
      <h1>{projet.titre}</h1>
      <p className="lead">{projet.description}</p>

      <h2>Réalisations</h2>
      <ul>
        {projet.details.map((d) => <li key={d}>{d}</li>)}
      </ul>

      <h2>Technologies</h2>
      <p className="tags">
        {projet.technologies.map((t) => <span key={t}>{t}</span>)}
      </p>

      {projet.lien && <p><a href={projet.lien}>Voir le code sur GitHub</a></p>}

      <Link className="back" href="/projects">← Retour aux projets</Link>
    </section>
  );
}
