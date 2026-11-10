import { describe, expect, it } from "vitest";
import { User } from "./user";
import { Email } from "./email";
import { RoleInvalide } from "./errors";
import { ValidationError } from "../shared/domain-error";

const now = new Date();
const reg = (over: Partial<Parameters<typeof User.register>[0]> = {}) =>
  User.register({ name: "Sara Hamza", email: "  Sara@Example.COM ", passwordHash: "hash", now, ...over });

describe("User", () => {
  it("inscrit toujours avec le rôle USER et normalise l'e-mail", () => {
    const u = reg();
    expect(u.role).toBe("USER");
    expect(u.email).toBe("sara@example.com");
  });
  it("rejette nom, e-mail ou mot de passe invalides", () => {
    expect(() => reg({ name: "S" })).toThrow(ValidationError);
    expect(() => reg({ email: "pas-un-email" })).toThrow(ValidationError);
    expect(() => reg({ passwordHash: "" })).toThrow(ValidationError);
  });
  it("change de rôle sans muter l'original", () => {
    const u = reg();
    expect(u.changeRole("MANAGER").role).toBe("MANAGER");
    expect(u.role).toBe("USER");
    expect(() => u.changeRole("ROOT")).toThrow(RoleInvalide);
  });
});

describe("Email", () => {
  it("valide le format", () => {
    expect(() => Email.of("a@b")).toThrow();
    expect(Email.of("a@b.tn")).toBe("a@b.tn");
  });
});
