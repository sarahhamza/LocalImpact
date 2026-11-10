export const ROLES = ["USER", "MANAGER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Le responsable et l'administrateur peuvent traiter des signalements. */
export function canBeAssigned(role: Role): boolean {
  return role === "MANAGER" || role === "ADMIN";
}
