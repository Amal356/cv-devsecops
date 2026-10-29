import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(50),
  email: z.string().email("L'adresse email est invalide"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères").max(1000),
});