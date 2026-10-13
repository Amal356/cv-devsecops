import { projects } from "@/data/projects";
import ProjectCard from "./ProjectCard";

// Liste des projets, générée à partir du tableau data/projects.js
export default function Projects({ titre = "Projects" }) {
  return (
    <section id="projects">
      <h2>{titre}</h2>
      {projects.map((p) => <ProjectCard key={p.slug} projet={p} />)}
    </section>
  );
}
