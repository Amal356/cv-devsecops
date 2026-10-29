import express from 'express';
import { contactSchema } from './contactSchema.js';
import { contactLimiter } from '../middlewares/rateLimiter.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.post('/', contactLimiter, async (req, res, next) => {
  try {
    // On valide les données avec Zod
    const result = contactSchema.safeParse(req.body);

    // Si c'est invalide, on renvoie une erreur 400
    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.issues.map(issue => ({
          field: issue.path[0],
          message: issue.message
        }))
      });
    }

    // Si c'est valide, on enregistre dans PostgreSQL via Prisma
    const { name, email, message } = result.data;
    
    const contact = await prisma.contact.create({
      data: { name, email, message }
    });

    res.status(201).json({
      success: true,
      message: 'Message enregistré dans la base de données !',
      data: contact
    });
  } catch (error) {
    // L'erreur est capturée par le middleware errorHandler
    next(error);
  }
});

export default router;