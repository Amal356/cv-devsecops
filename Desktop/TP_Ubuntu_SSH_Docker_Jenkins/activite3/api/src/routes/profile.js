import { Router } from "express";
import { profile } from "../../data/profile.js";
import { experience } from "../../data/experience.js";

const router = Router();

// GET /api/profile : informations principales du portfolio
router.get("/", (req, res) => {
  res.json({ ...profile, experience });
});

export default router;
