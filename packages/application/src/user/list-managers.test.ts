import { describe, expect, it } from "vitest";
import { createTestContext, expectFail, expectOk } from "../testing";
import { ListManagers } from "./list-managers";

describe("ListManagers", () => {
  it("renvoie les responsables et admins uniquement", async () => {
    const ctx = createTestContext();
    const admin = await ctx.createUser("ADMIN");
    await ctx.createUser("MANAGER");
    await ctx.createUser("USER");
    const list = expectOk(await new ListManagers({ users: ctx.users }).execute(admin));
    expect(list.map((u) => u.role).sort()).toEqual(["ADMIN", "MANAGER"]);
  });
  it("refuse un simple utilisateur", async () => {
    const ctx = createTestContext();
    expectFail(await new ListManagers({ users: ctx.users }).execute(await ctx.createUser("USER")), "NON_AUTORISE");
  });
});
