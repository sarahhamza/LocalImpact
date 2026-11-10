import { describe, expect, it } from "vitest";
import { Support } from "./support";
import { DejaSoutenu, SoutienImpossible } from "./errors";
import { ReportId } from "../report/report-id";
import { UserId } from "../user/user-id";

const report = { id: ReportId.generate(), status: "NEW" as const };
const u1 = UserId.generate();
const u2 = UserId.generate();
const now = new Date();

describe("Support.create", () => {
  it("enregistre un premier soutien", () => {
    expect(Support.create({ report, userId: u1, existingSupporters: [], now })).toEqual({
      reportId: report.id, userId: u1, createdAt: now,
    });
  });
  it("refuse un second soutien du même utilisateur", () => {
    expect(() => Support.create({ report, userId: u1, existingSupporters: [u1], now })).toThrow(DejaSoutenu);
  });
  it("autorise un autre utilisateur", () => {
    expect(() => Support.create({ report, userId: u2, existingSupporters: [u1], now })).not.toThrow();
  });
  it("refuse de soutenir un signalement résolu", () => {
    expect(() =>
      Support.create({ report: { ...report, status: "RESOLVED" }, userId: u1, existingSupporters: [], now }),
    ).toThrow(SoutienImpossible);
  });
});
