import { z } from "zod";

const schema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI est requis"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET doit faire au moins 32 caractères"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLOUDINARY_URL: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

/** Variables d'environnement validées au démarrage (serveur uniquement). */
export const env: Env = schema.parse(process.env);
