import express from "express";
import healthRouter from "./routes/health.js";
import profileRouter from "./routes/profile.js";
import projectsRouter from "./routes/projects.js";
import skillsRouter from "./routes/skills.js";

const app = express();

// Ne pas annoncer "X-Powered-By: Express" dans les réponses
app.disable("x-powered-by");

// JSON indenté : plus lisible dans le navigateur et avec curl
app.set("json spaces", 2);

// Journal minimal : méthode, URL, code de réponse et durée
app.use((req, res, next) => {
  const debut = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - debut} ms`);
  });
  next();
});

// Routes de l'API
app.use("/api/health", healthRouter);
app.use("/api/profile", profileRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/skills", skillsRouter);

// Route inconnue : réponse JSON 404
app.use((req, res) => {
  res.status(404).json({ erreur: "Route introuvable", route: req.originalUrl });
});

export default app;
