import { Router } from "express";
import { projects, getProject } from "../../data/projects.js";

const router = Router();

// GET /api/projects : liste des projets
router.get("/", (req, res) => {
  res.json(projects);
});

// GET /api/projects/:slug : un projet (utilisé par la page /projects/<slug>)
router.get("/:slug", (req, res) => {
  const projet = getProject(req.params.slug);
  if (!projet) {
    return res.status(404).json({ erreur: "Projet introuvable", slug: req.params.slug });
  }
  res.json(projet);
});

export default router;
