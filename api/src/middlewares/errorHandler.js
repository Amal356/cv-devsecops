export const errorHandler = (err, req, res, next) => {
  console.error(`[ERREUR] ${new Date().toISOString()} - ${err.message}`);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Une erreur interne est survenue.' : err.message,
  });
};
