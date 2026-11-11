import { UserId } from "@acme/domain";
import { describe, expect, it } from "vitest";
import type { Actor } from "./actor";
import { authorization } from "./authorization";

const as = (role: Actor["role"]): Actor => ({ id: UserId.generate(), role });

describe("authorization", () => {
  it("n'autorise la gestion des utilisateurs qu'à l'admin", () => {
    expect(authorization.canManageUsers(as("ADMIN"))).toBe(true);
    expect(authorization.canManageUsers(as("MANAGER"))).toBe(false);
    expect(authorization.canManageUsers(as("USER"))).toBe(false);
  });
  it("réserve le tableau de bord aux responsables et admins", () => {
    expect(authorization.canViewDashboard(as("USER"))).toBe(false);
    expect(authorization.canViewDashboard(as("MANAGER"))).toBe(true);
  });
  it("limite l'assignation d'un responsable à lui-même", () => {
    const m = as("MANAGER");
    expect(authorization.canAssign(m, m.id)).toBe(true);
    expect(authorization.canAssign(m, UserId.generate())).toBe(false);
    expect(authorization.canAssign(as("ADMIN"), UserId.generate())).toBe(true);
    const u = as("USER");
    expect(authorization.canAssign(u, u.id)).toBe(false);
  });
});
