import app from "./app.js";

// Port et adresse d'écoute lus dans les variables d'environnement
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`API DevSecOps Portfolio démarrée sur http://${HOST}:${PORT}`);
  console.log("Routes : /api/health /api/profile /api/projects /api/skills /api/contact");
});

// Arrêt propre quand Docker envoie SIGTERM (docker stop, docker compose down)
function arreter(signal) {
  console.log(`${signal} reçu, arrêt de l'API`);
  server.close(() => process.exit(0));
}
process.on("SIGTERM", arreter);
process.on("SIGINT", arreter);
