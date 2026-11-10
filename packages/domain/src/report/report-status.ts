/** NEW → TAKEN → IN_PROGRESS → RESOLVED (parcours linéaire, pas de retour arrière). */
export const REPORT_STATUSES = ["NEW", "TAKEN", "IN_PROGRESS", "RESOLVED"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

const NEXT: Record<ReportStatus, readonly ReportStatus[]> = {
  NEW: ["TAKEN"],
  TAKEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: [],
};

export function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === "string" && (REPORT_STATUSES as readonly string[]).includes(value);
}

export function allowedTransitions(from: ReportStatus): readonly ReportStatus[] {
  return NEXT[from];
}

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  return NEXT[from].includes(to);
}

export function isFinal(status: ReportStatus): boolean {
  return NEXT[status].length === 0;
}
