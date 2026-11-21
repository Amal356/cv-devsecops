import { Router } from "express";
import { flags } from "../lib/flags.js";

const router = Router();

// GET /api/nouveautes : fonctionnalité livrée « éteinte », activée par le feature flag "api-nouveautes".
// Le code est déployé partout (déploiement technique) ; flagd décide qui la voit (activation fonctionnelle).
router.get("/", async (req, res, next) => {
  try {
    // Contexte d'évaluation : flagd peut cibler un groupe (règle "targeting" du flag).
    // En production, ce groupe viendrait d'un jeton vérifié (Keycloak), pas d'un en-tête libre.
    const contexte = {
      targetingKey: req.get("x-utilisateur") || "anonyme",
      groupe: req.get("x-groupe") || "public",
    };
    const active = await flags.getBooleanValue("api-nouveautes", false, contexte);
    if (!active) {
      return res.status(404).json({ erreur: "Fonctionnalité non activée", flag: "api-nouveautes" });
    }
    res.json({
      flag: "api-nouveautes",
      nouveautes: [
        "Déploiements Blue/Green et Canary avec Argo Rollouts",
        "Rollback automatique piloté par Prometheus",
        "Feature flags OpenFeature + flagd",
      ],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
