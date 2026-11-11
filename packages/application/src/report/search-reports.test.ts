import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, expectFail, expectOk, type TestContext } from "../testing";
import { SearchReports } from "./search-reports";

let ctx: TestContext;
let uc: SearchReports;
beforeEach(() => {
  ctx = createTestContext();
  uc = new SearchReports({ reports: ctx.reports, users: ctx.users });
});

async function seed() {
  const user = await ctx.createUser("USER");
  const manager = await ctx.createUser("MANAGER");
  await ctx.createReport(user, { title: "Lampe cassée", category: "LIGHTING", location: "Bâtiment B" });
  ctx.clock.advance(1000);
  await ctx.createReport(user, { title: "Wifi inaccessible", category: "IT", location: "Bibliothèque", assignTo: manager, status: "TAKEN" });
  ctx.clock.advance(1000);
  await ctx.createReport(user, { title: "Rampe d'accès cassée", category: "ACCESSIBILITY", location: "Bâtiment A" });
  return { user, manager };
}

describe("SearchReports", () => {
  it("liste du plus récent au plus ancien avec pagination", async () => {
    const { user } = await seed();
    const p1 = expectOk(await uc.execute(user, { pageSize: 2 }));
    expect(p1.total).toBe(3);
    expect(p1.items).toHaveLength(2);
    expect(p1.items[0]!.title).toBe("Rampe d'accès cassée");
    expect(expectOk(await uc.execute(user, { pageSize: 2, page: 2 })).items).toHaveLength(1);
  });
  it("filtre par catégorie, statut, lieu et texte", async () => {
    const { user } = await seed();
    expect(expectOk(await uc.execute(user, { category: "IT" })).items.map((r) => r.title)).toEqual(["Wifi inaccessible"]);
    expect(expectOk(await uc.execute(user, { status: "TAKEN" })).total).toBe(1);
    expect(expectOk(await uc.execute(user, { location: "bâtiment" })).total).toBe(2);
    expect(expectOk(await uc.execute(user, { query: "cassée" })).total).toBe(2);
    expect(expectOk(await uc.execute(user, { category: "IT", status: "NEW" })).total).toBe(0);
  });
  it("« mes signalements assignés » cible le responsable connecté", async () => {
    const { manager } = await seed();
    const res = expectOk(await uc.execute(manager, { assignedToMe: true }));
    expect(res.items.map((r) => r.title)).toEqual(["Wifi inaccessible"]);
    expect(res.items[0]!.assignedToName).toBe(manager.name);
  });
  it("rejette un filtre inconnu", async () => {
    const { user } = await seed();
    expectFail(await uc.execute(user, { category: "NOPE" }), "VALIDATION");
    expectFail(await uc.execute(user, { status: "NOPE" }), "VALIDATION");
  });
  it("ramène une taille de page excessive à 50", async () => {
    const { user } = await seed();
    expect(expectOk(await uc.execute(user, { pageSize: 9999 })).pageSize).toBe(50);
  });
});
