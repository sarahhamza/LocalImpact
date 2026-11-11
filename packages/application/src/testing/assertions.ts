import type { Failure, Result } from "../shared/result";

/** Renvoie la valeur d'un succès, ou fait échouer le test avec l'erreur reçue. */
export function expectOk<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`Succès attendu, échec reçu : ${result.error.code} — ${result.error.message}`);
  return result.value;
}

/** Vérifie qu'on a bien un échec avec ce code ; renvoie l'échec pour d'autres assertions. */
export function expectFail<T>(result: Result<T>, code: string): Failure {
  if (result.ok) throw new Error(`Échec ${code} attendu, succès reçu`);
  if (result.error.code !== code) throw new Error(`Code ${code} attendu, reçu ${result.error.code}`);
  return result.error;
}
