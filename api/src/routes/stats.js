import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /api/stats : nombre de messages reçus (lecture PostgreSQL), affiché par le frontend.
// Activité 8, étape 230 : une page Next.js déclenche ainsi Next.js -> Express -> PostgreSQL.
router.get("/", async (req, res, next) => {
  try {
    res.json({ messages: await prisma.contact.count() });
  } catch (error) {
    next(error);
  }
});

export default router;
