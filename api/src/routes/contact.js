import express from 'express';
import { contactSchema } from './contactSchema.js';
import { contactLimiter } from '../middlewares/rateLimiter.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.post('/', contactLimiter, async (req, res, next) => {
  try {
    const result = contactSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.issues.map(i => ({ field: i.path[0], message: i.message })),
      });
    }
    const { name, email, message } = result.data;
    const contact = await prisma.contact.create({ data: { name, email, message } });
    res.status(201).json({ success: true, message: 'Message enregistré !', data: contact });
  } catch (error) { next(error); }
});

export default router;
