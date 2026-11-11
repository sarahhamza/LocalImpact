import { DomainError, ValidationError } from "@acme/domain";
import { AppError } from "./errors";

/** Échec « attendu » (règle métier, droits...) : le web le traduit en message utilisateur. */
export interface Failure {
  code: string;
  message: string;
  /** Champ concerné pour les erreurs de validation. */
  field?: string;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: Failure };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = (error: Failure): Result<never> => ({ ok: false, error });

/** Convertit une erreur métier/applicative en Failure ; null pour une erreur inattendue (bug, base...). */
export function toFailure(e: unknown): Failure | null {
  if (e instanceof ValidationError) return { code: e.code, message: e.message, field: e.field };
  if (e instanceof DomainError || e instanceof AppError) return { code: e.code, message: e.message };
  return null;
}

/** Exécute un use case : les erreurs attendues deviennent un Result, les autres remontent. */
export async function guard<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (e) {
    const failure = toFailure(e);
    if (failure) return fail(failure);
    throw e;
  }
}
