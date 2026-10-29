import { cache } from "react";

import { projects as projetsLocaux } from "@/data/projects";
import { skills as skillsLocaux, devsecopsSkills as devsecopsLocaux } from "@/data/skills";

// Appel à l'API Express. L'adresse vient de la variable d'environnement API_URL,
// lue au moment de la requête (et non au build) : la même image Docker
// fonctionne en local (http://localhost:4000) et dans Docker Compose (http://api:4000).
async function appelApi(chemin) {
  const base = process.env.API_URL;
  if (!base) throw new Error("variable API_URL non définie");

  const reponse = await fetch(`${base}${chemin}`, {
    cache: "no-store", // toujours les données à jour
    signal: AbortSignal.timeout(3000), // pas d'attente infinie si l'API ne répond pas
  });
  if (reponse.status === 404) return null;
  if (!reponse.ok) throw new Error(`réponse ${reponse.status} pour ${chemin}`);
  return reponse.json();
}

// Si l'API est injoignable, la page reste affichée avec les données locales (data/)
// et indique la source utilisée.
async function avecRepli(chemin, donneesLocales) {
  // Rendu à la demande : sans cela, Next.js générerait la page au build, quand l'API n'existe pas.
  // Appelé hors du try : Next.js doit voir ce signal, il ne faut pas l'intercepter.


  try {
    return { data: await appelApi(chemin), source: "api" };
  } catch (erreur) {
    console.error(`API indisponible (${chemin}) : ${erreur.message}, données locales utilisées`);
    return { data: donneesLocales, source: "local" };
  }
}

// cache() : un seul appel par requête, même si plusieurs composants demandent les mêmes données
export const getProjects = cache(() => avecRepli("/api/projects", projetsLocaux));

export const getProject = cache((slug) =>
  avecRepli(`/api/projects/${encodeURIComponent(slug)}`, projetsLocaux.find((p) => p.slug === slug) ?? null)
);

export const getSkills = cache(() =>
  avecRepli("/api/skills", { skills: skillsLocaux, devsecopsSkills: devsecopsLocaux })
);
