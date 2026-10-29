import { getSkills } from "@/lib/api";
import DataSource from "./DataSource";

export default async function DevSecOpsSkills() {
  const { data, source } = await getSkills();
  
  // Sécurité : on prend la première liste qu'on trouve
  const mesDonnees = data.devsecops || data.skills || data;

  return (
    <section id="devsecops">
      <h2>DevSecOps Skills</h2>
      <DataSource source={source} />
      
      <div className="grid" style={{ marginTop: '2rem' }}>
        {Array.isArray(mesDonnees) && mesDonnees.map((groupe) => (
          <div key={groupe.categorie} className="card">
            <h3 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{groupe.categorie}</h3>
            <ul style={{ color: 'var(--text-muted)', paddingLeft: '20px' }}>
              {groupe.items.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}