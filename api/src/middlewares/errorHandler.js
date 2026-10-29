// Filet de sécurité centralisé pour Express
export const errorHandler = (err, req, res, next) => {
  console.error(`[ERREUR] ${new Date().toISOString()} - ${err.message}`);
  
  // Si l'erreur a déjà un code HTTP, on l'utilise, sinon on met 500 (Erreur interne)
  const status = err.status || 500;
  
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Une erreur interne est survenue.' : err.message,
  });
};