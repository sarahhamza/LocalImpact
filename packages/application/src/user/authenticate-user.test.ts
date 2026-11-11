import { beforeEach, describe, it } from "vitest";
import { createTestContext, expectFail, expectOk, type TestContext } from "../testing";
import { AuthenticateUser } from "./authenticate-user";
import { expect } from "vitest";

let ctx: TestContext;
let auth: AuthenticateUser;
beforeEach(() => {
  ctx = createTestContext();
  auth = new AuthenticateUser({ users: ctx.users, hasher: ctx.hasher });
});

describe("AuthenticateUser", () => {
  it("connecte avec les bons identifiants", async () => {
    const u = await ctx.createUser("MANAGER", "Karim");
    const dto = expectOk(await auth.execute({ email: u.email, password: "password123" }));
    expect(dto).toMatchObject({ id: u.id, role: "MANAGER" });
  });
  it("renvoie la même erreur pour mauvais mot de passe, e-mail inconnu ou mal formé", async () => {
    const u = await ctx.createUser();
    const a = expectFail(await auth.execute({ email: u.email, password: "mauvais" }), "IDENTIFIANTS_INVALIDES");
    const b = expectFail(await auth.execute({ email: "inconnu@test.tn", password: "password123" }), "IDENTIFIANTS_INVALIDES");
    const c = expectFail(await auth.execute({ email: "n'importe quoi", password: "x" }), "IDENTIFIANTS_INVALIDES");
    expect(a.message).toBe(b.message);
    expect(b.message).toBe(c.message);
  });
});
