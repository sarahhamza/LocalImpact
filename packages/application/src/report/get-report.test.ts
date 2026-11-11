import { ReportId } from "@acme/domain";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, expectFail, expectOk, type TestContext } from "../testing";
import { GetReport } from "./get-report";

let ctx: TestContext;
let uc: GetReport;
beforeEach(() => {
  ctx = createTestContext();
  uc = new GetReport({ reports: ctx.reports, users: ctx.users, supports: ctx.supports, history: ctx.history });
});

describe("GetReport", () => {
  it("renvoie le détail avec noms, soutiens et historique daté", async () => {
    const author = await ctx.createUser("USER", "Amel");
    const manager = await ctx.createUser("MANAGER", "Karim");
    const r = await ctx.createReport(author, { assignTo: manager, status: "TAKEN" });
    const detail = expectOk(await uc.execute(author, r.id));
    expect(detail.report).toMatchObject({ authorName: "Amel", assignedToName: "Karim", status: "TAKEN" });
    expect(detail.history).toHaveLength(1);
    expect(detail.history[0]).toMatchObject({ from: "NEW", to: "TAKEN", authorName: "Karim" });
  });
  it("calcule les permissions selon le rôle", async () => {
    const author = await ctx.createUser("USER");
    const manager = await ctx.createUser("MANAGER");
    const other = await ctx.createUser("MANAGER");
    const admin = await ctx.createUser("ADMIN");
    const r = await ctx.createReport(author, { assignTo: manager });

    expect(expectOk(await uc.execute(author, r.id)).permissions).toEqual({
      canSupport: true, canAssign: false, canChangeStatus: false, nextStatuses: [],
    });
    expect(expectOk(await uc.execute(manager, r.id)).permissions).toMatchObject({ canChangeStatus: true, nextStatuses: ["TAKEN"] });
    expect(expectOk(await uc.execute(other, r.id)).permissions.canChangeStatus).toBe(false);
    expect(expectOk(await uc.execute(admin, r.id)).permissions).toMatchObject({ canAssign: true, canChangeStatus: true });
  });
  it("indique si l'utilisateur soutient déjà", async () => {
    const author = await ctx.createUser();
    const r = await ctx.createReport(author);
    await ctx.supports.add({ reportId: r.id, userId: author.id, createdAt: ctx.clock.now() });
    const d = expectOk(await uc.execute(author, r.id));
    expect(d).toMatchObject({ supportedByMe: true });
    expect(d.permissions.canSupport).toBe(false);
    expect(d.report.supportCount).toBe(1);
  });
  it("INTROUVABLE si le signalement n'existe pas", async () => {
    expectFail(await uc.execute(await ctx.createUser(), ReportId.generate()), "INTROUVABLE");
  });
});
