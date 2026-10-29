import { z } from "zod";

// Schéma strict (étape 48) : seuls name, email et message sont acceptés.
// Un champ supplémentaire (ex. "isAdmin") est refusé (OWASP API3).
export const contactSchema = z.strictObject({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(50, "Le nom est trop long"),
  email: z.string().trim().max(200, "L'adresse email est trop longue").email("L'adresse email est invalide"),
  message: z
    .string()
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(1000, "Le message est trop long (1000 caractères maximum)"),
});
