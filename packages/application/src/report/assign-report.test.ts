import { ReportId, UserId } from "@acme/domain";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, expectFail, expectOk, type TestContext } from "../testing";
import { AssignReport } from "./assign-report";

let ctx: TestContext;
let uc: AssignReport;
beforeEach(() => {
  ctx = createTestContext();
  uc = new AssignReport({ reports: ctx.reports, users: ctx.users, clock: ctx.clock });
});

describe("AssignReport", () => {
  it("l'admin assigne un responsable", async () => {
    const admin = await ctx.createUser("ADMIN");
    const manager = await ctx.createUser("MANAGER", "Karim");
    const r = await ctx.createReport(await ctx.createUser());
    expect(expectOk(await uc.execute(admin, { reportId: r.id, assigneeId: manager.id }))).toEqual({
      assignedToId: manager.id, assignedToName: "Karim",
    });
    expect((await ctx.reports.byId(r.id))!.assignedToId).toBe(manager.id);
  });
  it("un responsable peut se l'attribuer mais pas l'attribuer à un autre", async () => {
    const m1 = await ctx.createUser("MANAGER");
    const m2 = await ctx.createUser("MANAGER");
    const r = await ctx.createReport(await ctx.createUser());
    expectFail(await uc.execute(m1, { reportId: r.id, assigneeId: m2.id }), "NON_AUTORISE");
    expectOk(await uc.execute(m1, { reportId: r.id, assigneeId: m1.id }));
  });
  it("un simple utilisateur ne peut rien assigner", async () => {
    const u = await ctx.createUser();
    const r = await ctx.createReport(u);
    expectFail(await uc.execute(u, { reportId: r.id, assigneeId: u.id }), "NON_AUTORISE");
  });
  it("refuse d'assigner à un simple utilisateur, ou une cible inexistante", async () => {
    const admin = await ctx.createUser("ADMIN");
    const u = await ctx.createUser();
    const r = await ctx.createReport(u);
    expectFail(await uc.execute(admin, { reportId: r.id, assigneeId: u.id }), "ASSIGNATION_INVALIDE");
    expectFail(await uc.execute(admin, { reportId: ReportId.generate(), assigneeId: admin.id }), "INTROUVABLE");
    expectFail(await uc.execute(admin, { reportId: r.id, assigneeId: UserId.generate() }), "INTROUVABLE");
  });
});
