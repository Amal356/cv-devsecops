import { getProjects } from "@/lib/api";
import ProjectCard from "./ProjectCard";
import DataSource from "./DataSource";

// Liste des projets, récupérée depuis l'API Express (GET /api/projects)
export default async function Projects({ titre = "Projects" }) {
  const { data: projects, source } = await getProjects();

  return (
    <section id="projects">
      <h2>{titre}</h2>
      <DataSource source={source} />
      {projects.map((p) => <ProjectCard key={p.slug} projet={p} />)}
    </section>
  );
}
