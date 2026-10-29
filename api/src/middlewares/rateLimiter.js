import rateLimit from "express-rate-limit";

// Rate limiting de la route sensible /api/contact (étape 51, OWASP API4 et API6) :
// 5 requêtes par adresse IP toutes les 15 minutes, puis 429 Too Many Requests.
// Valeurs réglables par variables d'environnement (utile pour les tests).
export const contactLimiter = rateLimit({
  windowMs: Number(process.env.CONTACT_RATE_WINDOW_MS) || 15 * 60 * 1000,
  limit: Number(process.env.CONTACT_RATE_LIMIT) || 5,
  message: {
    success: false,
    message: "Trop de requêtes. Veuillez réessayer dans 15 minutes.",
  },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
