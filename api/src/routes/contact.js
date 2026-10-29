import express from "express";
import prisma from "../lib/prisma.js";
import { contactSchema } from "./contactSchema.js";
import { contactLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// POST /api/contact : reçoit un message du formulaire (étapes 46, 48, 51, 54)
router.post("/", contactLimiter, async (req, res, next) => {
  try {
    // 1. Validation stricte avec Zod : 400 si les données sont invalides
    const result = contactSchema.safeParse(req.body ?? {});
    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.issues.map((issue) => ({
          field: issue.path[0] ?? issue.keys?.join(", ") ?? "body",
          message: issue.code === "unrecognized_keys" ? "Champ non autorisé" : issue.message,
        })),
      });
    }

    // 2. Enregistrement dans PostgreSQL via Prisma (requête paramétrée : pas d'injection SQL)
    const { name, email, message } = result.data;
    const contact = await prisma.contact.create({ data: { name, email, message } });

    // 3. Réponse : seuls l'identifiant et la date sont renvoyés
    res.status(201).json({
      success: true,
      message: "Message enregistré !",
      data: { id: contact.id, createdAt: contact.createdAt },
    });
  } catch (error) {
    // Erreur inattendue (base indisponible…) : transmise au middleware errorHandler
    next(error);
  }
});

export default router;
