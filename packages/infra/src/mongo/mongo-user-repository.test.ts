import { User, UserId } from "@acme/domain";
import { EmailDejaUtilise } from "@acme/application";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoUserRepository } from "./mongo-user-repository";
import { openTestDb } from "./test-db";

let db: Awaited<ReturnType<typeof openTestDb>>;
let users: MongoUserRepository;
beforeAll(async () => { db = await openTestDb(); users = new MongoUserRepository(db.connect); });
afterAll(() => db.close());
beforeEach(() => db.clear());

const make = (name: string, email: string, role = "USER") =>
  User.register({ name, email, passwordHash: "h", now: new Date("2026-01-01T00:00:00Z") }).changeRole(role);

describe("MongoUserRepository", () => {
  it("aller-retour, recherche par id et par e-mail", async () => {
    const u = make("Sara", "sara@test.tn");
    await users.save(u);
    expect((await users.byId(u.id))!.toProps()).toEqual(u.toProps());
    expect((await users.byEmail("sara@test.tn"))!.id).toBe(u.id);
    expect(await users.byEmail("autre@test.tn")).toBeNull();
    expect(await users.byId(UserId.generate())).toBeNull();
  });
  it("save met à jour (changement de rôle) sans dupliquer", async () => {
    const u = make("Sara", "sara@test.tn");
    await users.save(u);
    await users.save(u.changeRole("MANAGER"));
    expect(await users.list()).toHaveLength(1);
    expect((await users.byId(u.id))!.role).toBe("MANAGER");
  });
  it("l'index unique sur l'e-mail est traduit en EmailDejaUtilise", async () => {
    await users.save(make("Sara", "sara@test.tn"));
    await expect(users.save(make("Autre Sara", "sara@test.tn"))).rejects.toBeInstanceOf(EmailDejaUtilise);
    expect(await users.list()).toHaveLength(1);
  });
  it("listByRoles et namesByIds", async () => {
    const a = make("Amel", "a@test.tn"); const k = make("Karim", "k@test.tn", "MANAGER"); const z = make("Zied", "z@test.tn", "ADMIN");
    for (const u of [a, k, z]) await users.save(u);
    expect((await users.listByRoles(["MANAGER", "ADMIN"])).map((u) => u.name)).toEqual(["Karim", "Zied"]);
    const names = await users.namesByIds([a.id, k.id, UserId.generate()]);
    expect([...names.values()].sort()).toEqual(["Amel", "Karim"]);
    expect((await users.namesByIds([])).size).toBe(0);
  });
});
