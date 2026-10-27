import { Router } from "express";
import { skills, devsecopsSkills } from "../../data/skills.js";

const router = Router();

// GET /api/skills : compétences générales et compétences DevSecOps
router.get("/", (req, res) => {
  res.json({ skills, devsecopsSkills });
});

export default router;
