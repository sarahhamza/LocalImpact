import { ReportId } from "@acme/domain";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, expectFail, expectOk, type TestContext } from "../testing";
import { SupportReport } from "./support-report";

let ctx: TestContext;
let uc: SupportReport;
beforeEach(() => {
  ctx = createTestContext();
  uc = new SupportReport({ reports: ctx.reports, supports: ctx.supports, clock: ctx.clock });
});

describe("SupportReport", () => {
  it("soutient un signalement et compte les soutiens", async () => {
    const a = await ctx.createUser();
    const b = await ctx.createUser();
    const r = await ctx.createReport(a);
    expect(expectOk(await uc.execute(a, r.id)).supportCount).toBe(1);
    expect(expectOk(await uc.execute(b, r.id)).supportCount).toBe(2);
  });
  it("un utilisateur ne peut soutenir qu'une seule fois", async () => {
    const a = await ctx.createUser();
    const r = await ctx.createReport(a);
    expectOk(await uc.execute(a, r.id));
    expectFail(await uc.execute(a, r.id), "DEJA_SOUTENU");
    expect(ctx.supports.countOf(r.id)).toBe(1);
  });
  it("la base (index unique) garde la même règle en cas de course", async () => {
    const a = await ctx.createUser();
    const r = await ctx.createReport(a);
    const [x, y] = await Promise.all([uc.execute(a, r.id), uc.execute(a, r.id)]);
    expect([x.ok, y.ok].filter(Boolean)).toHaveLength(1);
    expect(ctx.supports.countOf(r.id)).toBe(1);
  });
  it("refuse de soutenir un signalement résolu ou inexistant", async () => {
    const a = await ctx.createUser();
    const m = await ctx.createUser("MANAGER");
    const resolved = await ctx.createReport(a, { assignTo: m, status: "RESOLVED" });
    expectFail(await uc.execute(a, resolved.id), "SOUTIEN_IMPOSSIBLE");
    expectFail(await uc.execute(a, ReportId.generate()), "INTROUVABLE");
  });
});
