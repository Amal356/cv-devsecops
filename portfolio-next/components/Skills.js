import { getSkills } from "@/lib/api";
import DataSource from "./DataSource";

// Compétences générales, récupérées depuis l'API Express (GET /api/skills)
export default async function Skills() {
  const { data, source } = await getSkills();

  return (
    <section id="skills">
      <h2>Skills</h2>
      <DataSource source={source} />
      {data.skills.map((groupe) => (
        <div key={groupe.categorie}>
          <h3>{groupe.categorie}</h3>
          <p className="tags">
            {groupe.items.map((s) => <span key={s}>{s}</span>)}
          </p>
        </div>
      ))}
    </section>
  );
}
