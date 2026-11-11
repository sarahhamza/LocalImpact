import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, expectFail, expectOk, type TestContext } from "../testing";
import { ResolveReport } from "./resolve-report";

let ctx: TestContext;
let uc: ResolveReport;
beforeEach(() => {
  ctx = createTestContext();
  uc = new ResolveReport({ reports: ctx.reports, history: ctx.history, clock: ctx.clock });
});

describe("ResolveReport", () => {
  it("résout un signalement en cours et garde la description d'intervention", async () => {
    const manager = await ctx.createUser("MANAGER");
    const r = await ctx.createReport(await ctx.createUser(), { assignTo: manager, status: "IN_PROGRESS" });
    ctx.clock.advance(3_600_000);
    expectOk(await uc.execute(manager, { reportId: r.id, description: "Ampoule remplacée, test OK" }));

    const saved = (await ctx.reports.byId(r.id))!;
    expect(saved.status).toBe("RESOLVED");
    expect(saved.resolutionDescription).toBe("Ampoule remplacée, test OK");
    expect(saved.resolutionTimeMs()).toBe(3_600_000);
    expect((await ctx.history.byReport(r.id)).at(-1)).toMatchObject({ to: "RESOLVED", note: "Ampoule remplacée, test OK" });
  });
  it("exige une description", async () => {
    const manager = await ctx.createUser("MANAGER");
    const r = await ctx.createReport(await ctx.createUser(), { assignTo: manager, status: "IN_PROGRESS" });
    expectFail(await uc.execute(manager, { reportId: r.id, description: "  " }), "RESOLUTION_SANS_DESCRIPTION");
  });
  it("refuse si le signalement n'est pas en cours", async () => {
    const manager = await ctx.createUser("MANAGER");
    const r = await ctx.createReport(await ctx.createUser(), { assignTo: manager });
    expectFail(await uc.execute(manager, { reportId: r.id, description: "Description suffisante" }), "TRANSITION_INVALIDE");
  });
  it("refuse un responsable non assigné ou un utilisateur", async () => {
    const manager = await ctx.createUser("MANAGER");
    const other = await ctx.createUser("MANAGER");
    const user = await ctx.createUser();
    const r = await ctx.createReport(user, { assignTo: manager, status: "IN_PROGRESS" });
    expectFail(await uc.execute(other, { reportId: r.id, description: "Description suffisante" }), "NON_AUTORISE");
    expectFail(await uc.execute(user, { reportId: r.id, description: "Description suffisante" }), "NON_AUTORISE");
  });
});
