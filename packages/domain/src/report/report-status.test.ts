import { describe, expect, it } from "vitest";
import { REPORT_STATUSES, allowedTransitions, canTransition, isFinal } from "./report-status";

describe("report-status", () => {
  it("n'autorise que l'étape suivante", () => {
    expect(canTransition("NEW", "TAKEN")).toBe(true);
    expect(canTransition("TAKEN", "IN_PROGRESS")).toBe(true);
    expect(canTransition("IN_PROGRESS", "RESOLVED")).toBe(true);
    for (const from of REPORT_STATUSES) expect(canTransition(from, from)).toBe(false);
    expect(canTransition("NEW", "RESOLVED")).toBe(false);
    expect(canTransition("RESOLVED", "NEW")).toBe(false);
  });
  it("RESOLVED est final", () => {
    expect(isFinal("RESOLVED")).toBe(true);
    expect(allowedTransitions("RESOLVED")).toEqual([]);
    expect(isFinal("NEW")).toBe(false);
  });
});
