import { describe, expect, it } from "vitest";
import { createTestContext, expectFail, expectOk } from "../testing";
import { ListUsers } from "./list-users";

describe("ListUsers", () => {
  it("l'admin voit tous les utilisateurs", async () => {
    const ctx = createTestContext();
    const admin = await ctx.createUser("ADMIN");
    await ctx.createUser("USER");
    const list = expectOk(await new ListUsers({ users: ctx.users }).execute(admin));
    expect(list).toHaveLength(2);
  });
  it("refuse responsable et utilisateur (contrôle côté serveur)", async () => {
    const ctx = createTestContext();
    const uc = new ListUsers({ users: ctx.users });
    expectFail(await uc.execute(await ctx.createUser("MANAGER")), "NON_AUTORISE");
    expectFail(await uc.execute(await ctx.createUser("USER")), "NON_AUTORISE");
  });
});
