import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, expectFail, expectOk, type TestContext } from "../testing";
import { RegisterUser } from "./register-user";

let ctx: TestContext;
let register: RegisterUser;
beforeEach(() => {
  ctx = createTestContext();
  register = new RegisterUser({ users: ctx.users, hasher: ctx.hasher, clock: ctx.clock });
});
const valid = { name: "Sara Hamza", email: "Sara@Test.tn", password: "motdepasse1" };

describe("RegisterUser", () => {
  it("crée un utilisateur USER avec mot de passe haché, sans le divulguer", async () => {
    const dto = expectOk(await register.execute(valid));
    expect(dto).toMatchObject({ name: "Sara Hamza", email: "sara@test.tn", role: "USER" });
    expect(dto).not.toHaveProperty("passwordHash");
    const stored = (await ctx.users.byEmail("sara@test.tn"))!;
    expect(stored.passwordHash).toBe("hashed:motdepasse1");
  });
  it("refuse un e-mail déjà utilisé (insensible à la casse)", async () => {
    expectOk(await register.execute(valid));
    expectFail(await register.execute({ ...valid, email: "SARA@test.tn" }), "EMAIL_DEJA_UTILISE");
  });
  it("valide mot de passe, e-mail et nom", async () => {
    expect(expectFail(await register.execute({ ...valid, password: "court" }), "VALIDATION").field).toBe("password");
    expect(expectFail(await register.execute({ ...valid, email: "pasunemail" }), "VALIDATION").field).toBe("email");
    expect(expectFail(await register.execute({ ...valid, name: "S" }), "VALIDATION").field).toBe("name");
    expect(await ctx.users.list()).toHaveLength(0);
  });
});
