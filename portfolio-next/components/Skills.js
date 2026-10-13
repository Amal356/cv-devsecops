import { skills } from "@/data/skills";

// Compétences générales, lues depuis data/skills.js
export default function Skills() {
  return (
    <section id="skills">
      <h2>Skills</h2>
      {skills.map((groupe) => (
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
