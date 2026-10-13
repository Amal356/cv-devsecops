import { devsecopsSkills } from "@/data/skills";

// Technologies DevSecOps du projet, lues depuis data/skills.js
export default function DevSecOpsSkills() {
  return (
    <section id="devsecops">
      <h2>DevSecOps Skills</h2>
      <p className="lead">
        Les technologies de ce projet. Git, Docker et Jenkins sont pratiqués dans les TP, les autres sont au programme du master.
      </p>
      <ul className="tools">
        {devsecopsSkills.map((t) => (
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
