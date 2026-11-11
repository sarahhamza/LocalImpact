import { UserId } from "@acme/domain";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, expectFail, expectOk, type TestContext } from "../testing";
import { ChangeUserRole } from "./change-user-role";

let ctx: TestContext;
let uc: ChangeUserRole;
beforeEach(() => {
  ctx = createTestContext();
  uc = new ChangeUserRole({ users: ctx.users });
});

describe("ChangeUserRole", () => {
  it("l'admin promeut un utilisateur", async () => {
    const admin = await ctx.createUser("ADMIN");
    const user = await ctx.createUser("USER");
    expect(expectOk(await uc.execute(admin, { userId: user.id, role: "MANAGER" })).role).toBe("MANAGER");
    expect((await ctx.users.byId(user.id))!.role).toBe("MANAGER");
  });
  it("refuse tout non-admin", async () => {
    const manager = await ctx.createUser("MANAGER");
    const user = await ctx.createUser("USER");
    expectFail(await uc.execute(manager, { userId: user.id, role: "ADMIN" }), "NON_AUTORISE");
    expectFail(await uc.execute(user, { userId: user.id, role: "ADMIN" }), "NON_AUTORISE");
    expect((await ctx.users.byId(user.id))!.role).toBe("USER");
  });
  it("empêche l'admin de modifier son propre rôle", async () => {
    const admin = await ctx.createUser("ADMIN");
    expectFail(await uc.execute(admin, { userId: admin.id, role: "USER" }), "NON_AUTORISE");
  });
  it("rejette un rôle inconnu ou un utilisateur inexistant", async () => {
    const admin = await ctx.createUser("ADMIN");
    const user = await ctx.createUser("USER");
    expectFail(await uc.execute(admin, { userId: user.id, role: "ROOT" }), "VALIDATION");
    expectFail(await uc.execute(admin, { userId: UserId.generate(), role: "MANAGER" }), "INTROUVABLE");
  });
});
