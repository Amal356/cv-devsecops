import express from "express";
import cors from "cors";
import helmet from "helmet";

import healthRouter from "./routes/health.js";
import profileRouter from "./routes/profile.js";
import projectsRouter from "./routes/projects.js";
import skillsRouter from "./routes/skills.js";
import contactRouter from "./routes/contact.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// En-têtes HTTP de sécurité (étape 50)
app.use(helmet());

// CORS : seule l'origine du portfolio peut appeler l'API depuis un navigateur.
// CORS_ORIGIN peut contenir plusieurs origines séparées par des virgules.
const originesAutorisees = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());
app.use(cors({ origin: originesAutorisees, methods: ["GET", "POST"] }));

// Lecture du JSON du corps de requête, taille limitée (OWASP API4)
app.use(express.json({ limit: "10kb" }));

// Ne pas annoncer "X-Powered-By: Express" dans les réponses
app.disable("x-powered-by");

// JSON indenté : plus lisible dans le navigateur et avec curl
app.set("json spaces", 2);

// Journal minimal : méthode, URL, code de réponse et durée (désactivé pendant les tests)
if (process.env.NODE_ENV !== "test") {
  app.use((req, res, next) => {
    const debut = Date.now();
    res.on("finish", () => {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - debut} ms`);
    });
    next();
  });
}

// Routes de l'API
app.use("/api/health", healthRouter);
app.use("/api/profile", profileRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/contact", contactRouter);

// Route inconnue : réponse JSON 404
app.use((req, res) => {
  res.status(404).json({ erreur: "Route introuvable", route: req.originalUrl });
});

// Gestion centralisée des erreurs (étape 49) : toujours en dernier
app.use(errorHandler);

export default app;
