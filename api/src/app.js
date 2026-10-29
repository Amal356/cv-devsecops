import express from "express";
import healthRouter from "./routes/health.js";
import profileRouter from "./routes/profile.js";
import projectsRouter from "./routes/projects.js";
import skillsRouter from "./routes/skills.js";
import contactRouter from "./routes/contact.js";
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler.js';
import helmet from 'helmet';
console.log("Route contact importée :", contactRouter);
const app = express();
app.use(helmet());
app.use(cors());

// Permet de lire le JSON envoyé dans le corps de la requête (req.body)
app.use(express.json());

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
app.use("/api", contactRouter); // <--- LIGNE DÉPLACÉE ICI (avant le 404)

// Route inconnue : réponse JSON 404
app.use((req, res) => {
  res.status(404).json({ erreur: "Route introuvable", route: req.originalUrl });
});
app.use(errorHandler);
export default app;