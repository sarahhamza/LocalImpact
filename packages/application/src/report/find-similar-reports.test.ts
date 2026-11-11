import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, expectOk, type TestContext } from "../testing";
import { FindSimilarReports } from "./find-similar-reports";

let ctx: TestContext;
let uc: FindSimilarReports;
beforeEach(() => {
  ctx = createTestContext();
  uc = new FindSimilarReports({ reports: ctx.reports, supports: ctx.supports });
});

describe("FindSimilarReports", () => {
  it("suggère un doublon probable avec son nombre de soutiens", async () => {
    const user = await ctx.createUser();
    const existing = await ctx.createReport(user, { title: "Lampe cassée dans le couloir", description: "Lampe du couloir bâtiment B cassée" });
    await ctx.createReport(user, { title: "Wifi inaccessible", description: "Pas de réseau salle 12", category: "IT", location: "Salle 12" });
    await ctx.supports.add({ reportId: existing.id, userId: user.id, createdAt: ctx.clock.now() });

    const res = expectOk(await uc.execute(user, {
      title: "Lampe du couloir cassée", description: "couloir bâtiment B", category: "LIGHTING", location: "Bâtiment B",
    }));
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ id: existing.id, supportCount: 1 });
    expect(res[0]!.score).toBeGreaterThan(0.5);
  });
  it("ne suggère rien pour un titre trop court ou sans rapport", async () => {
    const user = await ctx.createUser();
    await ctx.createReport(user);
    expect(expectOk(await uc.execute(user, { title: "ab" }))).toEqual([]);
    expect(expectOk(await uc.execute(user, { title: "Fuite d'eau toilettes", description: "Eau au sol", category: "CLEANLINESS", location: "RDC" }))).toEqual([]);
  });
  it("n'inclut pas les signalements résolus", async () => {
    const user = await ctx.createUser();
    const manager = await ctx.createUser("MANAGER");
    await ctx.createReport(user, { assignTo: manager, status: "RESOLVED" });
    expect(expectOk(await uc.execute(user, { title: "Lampe cassée couloir B", description: "lampe couloir", category: "LIGHTING", location: "Bâtiment B" }))).toEqual([]);
  });
});
