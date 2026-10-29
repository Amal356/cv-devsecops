import { experience } from "@/data/experience";

export default function Experience() {
  return (
    <section id="experience">
      <h2>Experience</h2>
      {experience.map((e) => (
        <article key={e.poste + e.periode}>
          <h3>{e.poste}</h3>
          <p className="meta">{e.entreprise} · {e.periode}</p>
          <p>{e.description}</p>
        </article>
      ))}
    </section>
  );
}
