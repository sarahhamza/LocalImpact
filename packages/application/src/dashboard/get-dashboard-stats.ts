import type { Category, ReportStatus } from "@acme/domain";
import type { ReportRepository } from "../ports";
import type { Actor } from "../shared/actor";
import { assert, authorization } from "../shared/authorization";
import { guard, type Result } from "../shared/result";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export interface DashboardStats {
  total: number;
  byStatus: Record<ReportStatus, number>;
  byCategory: Record<Category, number>;
  resolution: {
    resolvedCount: number;
    /** Délai moyen de résolution en heures (null si rien n'est résolu). */
    averageHours: number | null;
    /** Répartition des délais : sert au graphique « délai de résolution ». */
    buckets: { label: string; count: number }[];
  };
}

const BUCKETS: { label: string; max: number }[] = [
  { label: "< 24 h", max: DAY },
  { label: "1 à 3 jours", max: 3 * DAY },
  { label: "3 à 7 jours", max: 7 * DAY },
  { label: "> 7 jours", max: Infinity },
];

/** Calcul pur (testable sans base) à partir des délais bruts. */
export function summarizeResolution(timesMs: readonly number[]): DashboardStats["resolution"] {
  const buckets = BUCKETS.map((b) => ({ label: b.label, count: 0 }));
  for (const t of timesMs) {
    const i = BUCKETS.findIndex((b) => t < b.max);
    buckets[i]!.count++;
  }
  const average = timesMs.length ? timesMs.reduce((s, t) => s + t, 0) / timesMs.length / HOUR : null;
  return {
    resolvedCount: timesMs.length,
    averageHours: average === null ? null : Math.round(average * 10) / 10,
    buckets,
  };
}

export class GetDashboardStats {
  constructor(private readonly deps: { reports: ReportRepository }) {}

  execute(actor: Actor): Promise<Result<DashboardStats>> {
    return guard(async () => {
      assert(authorization.canViewDashboard(actor));
      const s = await this.deps.reports.stats();
      return {
        total: s.total,
        byStatus: s.byStatus,
        byCategory: s.byCategory,
        resolution: summarizeResolution(s.resolutionTimesMs),
      };
    });
  }
}
