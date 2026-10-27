import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/api";
import DataSource from "@/components/DataSource";

// Les projets viennent de l'API au moment de la requête :
// un slug inconnu de l'API renvoie la page 404.

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data: projet } = await getProject(slug);
  return { title: projet ? `${projet.titre} – Amal Jemli` : "Projet introuvable" };
}

// Page /projects/<slug> : détail d'un projet (GET /api/projects/:slug)
export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const { data: projet, source } = await getProject(slug);
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

      <DataSource source={source} />
      <Link className="back" href="/projects">← Retour aux projets</Link>
    </section>
  );
}
