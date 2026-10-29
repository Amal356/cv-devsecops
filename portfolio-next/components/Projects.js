import { getProjects } from "@/lib/api";
import DataSource from "./DataSource";
import Link from "next/link";

export default async function Projects() {
  const { data, source } = await getProjects();

  return (
    <section id="projects">
      <h2>Projets</h2>
      <DataSource source={source} />
      
      <div className="grid" style={{ marginTop: '2rem' }}>
        {data.map((projet) => (
          <div key={projet.slug} className="card">
            <h3 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>{projet.titre}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.95rem' }}>
              {projet.description}
            </p>
            <Link href={`/projects/${projet.slug}`} style={{ fontWeight: '600' }}>
              Voir le projet →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}