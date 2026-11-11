import { describe, expect, it } from "vitest";
import { createTestContext, expectFail, expectOk } from "../testing";
import { GetDashboardStats, summarizeResolution } from "./get-dashboard-stats";

const H = 3_600_000;

describe("GetDashboardStats", () => {
  it("les statistiques correspondent aux données enregistrées", async () => {
    const ctx = createTestContext();
    const user = await ctx.createUser();
    const manager = await ctx.createUser("MANAGER");
    await ctx.createReport(user, { category: "LIGHTING" });
    await ctx.createReport(user, { category: "LIGHTING", assignTo: manager, status: "IN_PROGRESS" });
    await ctx.createReport(user, { category: "IT", assignTo: manager, status: "RESOLVED", resolveAfterMs: 2 * H });
    await ctx.createReport(user, { category: "IT", assignTo: manager, status: "RESOLVED", resolveAfterMs: 4 * H });

    const stats = expectOk(await new GetDashboardStats({ reports: ctx.reports }).execute(manager));
    expect(stats.total).toBe(4);
    expect(stats.byStatus).toEqual({ NEW: 1, TAKEN: 0, IN_PROGRESS: 1, RESOLVED: 2 });
    expect(stats.byCategory).toMatchObject({ LIGHTING: 2, IT: 2, EQUIPMENT: 0 });
    expect(Object.values(stats.byStatus).reduce((a, b) => a + b, 0)).toBe(stats.total);
    expect(stats.resolution.resolvedCount).toBe(2);
    // délais de 2 h et 4 h → moyenne 3 h
    expect(stats.resolution.averageHours).toBe(3);
  });
  it("tableau de bord vide : pas de division par zéro", async () => {
    const ctx = createTestContext();
    const admin = await ctx.createUser("ADMIN");
    const stats = expectOk(await new GetDashboardStats({ reports: ctx.reports }).execute(admin));
    expect(stats.total).toBe(0);
    expect(stats.resolution).toMatchObject({ resolvedCount: 0, averageHours: null });
  });
  it("refuse un simple utilisateur", async () => {
    const ctx = createTestContext();
    expectFail(await new GetDashboardStats({ reports: ctx.reports }).execute(await ctx.createUser()), "NON_AUTORISE");
  });
});

describe("summarizeResolution", () => {
  it("répartit les délais en tranches", () => {
    const r = summarizeResolution([1 * H, 23 * H, 24 * H, 50 * H, 5 * 24 * H, 10 * 24 * H]);
    expect(r.buckets).toEqual([
      { label: "< 24 h", count: 2 },
      { label: "1 à 3 jours", count: 2 },
      { label: "3 à 7 jours", count: 1 },
      { label: "> 7 jours", count: 1 },
    ]);
    expect(r.resolvedCount).toBe(6);
  });
});
