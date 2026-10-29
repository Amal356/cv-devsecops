import { getSkills } from "@/lib/api";
import DataSource from "./DataSource";

export default async function Skills() {
  const { data, source } = await getSkills();
  
  // Sécurité : on prend la première liste qu'on trouve
  const mesDonnees = data.skills || data;

  return (
    <section id="skills">
      <h2>Skills</h2>
      <DataSource source={source} />
      
      <div className="grid" style={{ marginTop: '2rem' }}>
        {Array.isArray(mesDonnees) && mesDonnees.map((groupe) => (
          <div key={groupe.categorie} className="card">
            <h3 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{groupe.categorie}</h3>
            <p className="tags" style={{ color: 'var(--text-muted)' }}>
              {groupe.items.map((s) => (
                <span key={s} style={{ display: 'inline-block', marginRight: '10px', marginBottom: '5px' }}>
                  {s}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}