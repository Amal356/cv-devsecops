import express from 'express';
const router = express.Router();

router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
  }

  res.status(201).json({
    success: true,
    message: 'Message reçu avec succès !',
    data: { name, email, message }
  });
});

export default router;