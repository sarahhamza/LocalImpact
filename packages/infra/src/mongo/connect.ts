/** Garantit qu'une connexion est ouverte (no-op si elle l'est déjà : voir le cache de `connectMongo`). */
export type Connect = () => Promise<unknown>;

/** Violation d'index unique MongoDB (E11000). */
export function isDuplicateKey(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: number }).code === 11000;
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
