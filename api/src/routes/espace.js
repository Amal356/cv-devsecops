import { Router } from "express";
import prisma from "../lib/prisma.js";
import { exigerRole } from "../lib/auth.js";

// Activité 9, partie 50 : routes protégées par Keycloak (OIDC), une par rôle.
//   user      : GET /api/espace/moi
//   developer : GET /api/espace/developpeur
//   admin     : GET /api/espace/admin/messages
const router = Router();
const rolesMetier = (roles) => roles.filter((r) => ["user", "developer", "admin"].includes(r));

router.get("/moi", exigerRole("user"), (req, res) => {
  res.json({ utilisateur: req.utilisateur.nom, roles: rolesMetier(req.utilisateur.roles) });
});

router.get("/developpeur", exigerRole("developer"), (req, res) => {
  res.json({
    utilisateur: req.utilisateur.nom,
    version: process.env.APP_VERSION ?? "dev",
    node: process.version,
    uptime_s: Math.round(process.uptime()),
  });
});

router.get("/admin/messages", exigerRole("admin"), async (req, res, next) => {
  try {
    const messages = await prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    });
    res.json({ utilisateur: req.utilisateur.nom, messages });
  } catch (erreur) {
    next(erreur);
  }
});

export default router;
