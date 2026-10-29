// Gestion centralisée des erreurs (étape 49) : toujours une réponse JSON propre,
// sans pile d'appels ni détail interne envoyé au client.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // JSON malformé envoyé par le client (erreur levée par express.json)
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Corps de requête JSON invalide." });
  }
  // Corps trop volumineux (limite de express.json)
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Requête trop volumineuse." });
  }

  const status = err.status || err.statusCode || 500;
  if (status >= 500 && process.env.NODE_ENV !== "test") {
    console.error(`[ERREUR] ${new Date().toISOString()} ${req.method} ${req.originalUrl} - ${err.message}`);
  }

  res.status(status).json({
    success: false,
    message: status >= 500 ? "Une erreur interne est survenue." : err.message,
  });
};
