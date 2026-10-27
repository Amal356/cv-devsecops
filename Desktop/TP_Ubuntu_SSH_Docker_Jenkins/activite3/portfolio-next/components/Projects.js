import { getProjects } from "@/lib/api";
import DataSource from "./DataSource";
import Link from "next/link";

export default async function Projects() {
  const { data, source } = await getProjects();

  return (
    <section id="projects" style={{ padding: '2rem' }}>
      <h2>Projets</h2>
      <DataSource source={source} />
      
      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {data.map((projet) => (
          <div key={projet.slug} style={{ border: '1px solid #444', padding: '1rem', borderRadius: '8px' }}>
            <h3>{projet.titre}</h3>
            <p>{projet.description}</p>
            <Link href={`/projects/${projet.slug}`} style={{ color: '#4ade80' }}>
              Voir le projet →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}