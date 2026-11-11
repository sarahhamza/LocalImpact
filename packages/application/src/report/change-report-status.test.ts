import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, expectFail, expectOk, type TestContext } from "../testing";
import { ChangeReportStatus } from "./change-report-status";

let ctx: TestContext;
let uc: ChangeReportStatus;
beforeEach(() => {
  ctx = createTestContext();
  uc = new ChangeReportStatus({ reports: ctx.reports, history: ctx.history, clock: ctx.clock });
});

describe("ChangeReportStatus", () => {
  it("fait avancer le statut et historise chaque changement (date + auteur)", async () => {
    const manager = await ctx.createUser("MANAGER");
    const r = await ctx.createReport(await ctx.createUser(), { assignTo: manager });

    expectOk(await uc.execute(manager, { reportId: r.id, status: "TAKEN" }));
    ctx.clock.advance(60_000);
    expectOk(await uc.execute(manager, { reportId: r.id, status: "IN_PROGRESS" }));
    ctx.clock.advance(60_000);
    expectOk(await uc.execute(manager, { reportId: r.id, status: "RESOLVED", description: "Ampoule remplacée par l'équipe" }));

    const history = await ctx.history.byReport(r.id);
    expect(history.map((h) => `${h.from}>${h.to}`)).toEqual(["NEW>TAKEN", "TAKEN>IN_PROGRESS", "IN_PROGRESS>RESOLVED"]);
    expect(history.every((h) => h.authorId === manager.id)).toBe(true);
    expect(history[2]!.at.getTime() - history[0]!.at.getTime()).toBe(120_000);
    expect(history[2]!.note).toBe("Ampoule remplacée par l'équipe");
    expect((await ctx.reports.byId(r.id))!.status).toBe("RESOLVED");
  });
  it("l'admin peut changer le statut de n'importe quel signalement", async () => {
    const admin = await ctx.createUser("ADMIN");
    const r = await ctx.createReport(await ctx.createUser());
    expectOk(await uc.execute(admin, { reportId: r.id, status: "TAKEN" }));
  });
  it("refuse utilisateur, autre responsable et responsable non assigné — sans écrire d'historique", async () => {
    const manager = await ctx.createUser("MANAGER");
    const other = await ctx.createUser("MANAGER");
    const user = await ctx.createUser();
    const assigned = await ctx.createReport(user, { assignTo: manager });
    const unassigned = await ctx.createReport(user);
    expectFail(await uc.execute(user, { reportId: assigned.id, status: "TAKEN" }), "NON_AUTORISE");
    expectFail(await uc.execute(other, { reportId: assigned.id, status: "TAKEN" }), "NON_AUTORISE");
    expectFail(await uc.execute(manager, { reportId: unassigned.id, status: "TAKEN" }), "NON_AUTORISE");
    expect(ctx.history.items).toHaveLength(0);
  });
  it("refuse une transition invalide et un statut inconnu", async () => {
    const manager = await ctx.createUser("MANAGER");
    const r = await ctx.createReport(await ctx.createUser(), { assignTo: manager });
    expectFail(await uc.execute(manager, { reportId: r.id, status: "IN_PROGRESS" }), "TRANSITION_INVALIDE");
    expectFail(await uc.execute(manager, { reportId: r.id, status: "BIDON" }), "VALIDATION");
    expect(ctx.history.items).toHaveLength(0);
  });
  it("la résolution nécessite une description d'intervention", async () => {
    const manager = await ctx.createUser("MANAGER");
    const r = await ctx.createReport(await ctx.createUser(), { assignTo: manager, status: "IN_PROGRESS" });
    expectFail(await uc.execute(manager, { reportId: r.id, status: "RESOLVED" }), "RESOLUTION_SANS_DESCRIPTION");
    expect((await ctx.reports.byId(r.id))!.status).toBe("IN_PROGRESS");
  });
});
