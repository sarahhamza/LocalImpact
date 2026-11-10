import { ValidationError } from "./domain-error";

/** UUID v4 (API Web Crypto, disponible sous Node ≥ 19 et dans les navigateurs). */
export function newId(): string {
  return globalThis.crypto.randomUUID();
}

export function assertNonEmptyId(value: string, field: string): string {
  const v = typeof value === "string" ? value.trim() : "";
  if (v.length === 0) throw new ValidationError(field, `${field} ne peut pas être vide`);
  return v;
}
