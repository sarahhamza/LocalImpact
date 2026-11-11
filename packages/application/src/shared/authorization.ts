import { canBeAssigned, type Report, type UserId } from "@acme/domain";
import type { Actor } from "./actor";
import { NonAutorise } from "./errors";

/**
 * Règles de droits — défense en profondeur : le web cache les boutons, mais
 * chaque use case revérifie ici (les restrictions de rôle sont contrôlées côté serveur).
 */
export const authorization = {
  canManageUsers: (a: Actor) => a.role === "ADMIN",
  canViewDashboard: (a: Actor) => a.role === "MANAGER" || a.role === "ADMIN",
  canListManagers: (a: Actor) => a.role === "MANAGER" || a.role === "ADMIN",
  /** Admin : n'importe qui. Responsable : uniquement lui-même (prise en charge). */
  canAssign: (a: Actor, assigneeId: UserId) =>
    a.role === "ADMIN" || (a.role === "MANAGER" && a.id === assigneeId),
  /** Admin, ou responsable assigné à CE signalement. */
  canChangeStatus: (a: Actor, report: Report) => report.canChangeStatus(a),
  canAssignTarget: (role: Parameters<typeof canBeAssigned>[0]) => canBeAssigned(role),
};

export function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) throw new NonAutorise(message);
}
