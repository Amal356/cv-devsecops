import { getSkills } from "@/lib/api";
import DataSource from "./DataSource";

// Technologies DevSecOps du projet, récupérées depuis l'API Express (GET /api/skills)
export default async function DevSecOpsSkills() {
  const { data, source } = await getSkills();

  return (
    <section id="devsecops">
      <h2>DevSecOps Skills</h2>
      <p className="lead">
        Les technologies de ce projet : celles déjà pratiquées dans les TP et celles au programme du master.
      </p>
      <DataSource source={source} />
      <ul className="tools">
        {data.devsecopsSkills.map((t) => (
          <li key={t.nom}>
            <strong>{t.nom}</strong>
            <span>{t.role}</span>
            <em className={t.pratique ? "done" : undefined}>
              {t.pratique ? "Pratiqué dans ce projet" : "Au programme"}
            </em>
          </li>
        ))}
      </ul>
    </section>
  );
}
