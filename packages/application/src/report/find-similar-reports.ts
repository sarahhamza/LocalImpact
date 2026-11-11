import { findSimilar, type ReportId, type ReportStatus } from "@acme/domain";
import type { ReportRepository, SupportRepository } from "../ports";
import type { Actor } from "../shared/actor";
import { guard, type Result } from "../shared/result";

export interface SimilarReportDto {
  id: string;
  title: string;
  status: ReportStatus;
  score: number;
  reasons: string[];
  supportCount: number;
}

/** Fonctionnalité originale : suggère des doublons pendant la saisie, pour inciter à « soutenir ». */
export class FindSimilarReports {
  constructor(private readonly deps: { reports: ReportRepository; supports: SupportRepository }) {}

  execute(
    _actor: Actor,
    input: { title: string; description?: string; category?: string; location?: string },
  ): Promise<Result<SimilarReportDto[]>> {
    return guard(async () => {
      const target = {
        title: (input.title ?? "").trim(),
        description: (input.description ?? "").trim(),
        category: input.category ?? "",
        location: input.location ?? "",
      };
      if (target.title.length < 3) return [];

      const candidates = await this.deps.reports.findSimilar(target, 50);
      const hits = findSimilar(target, candidates, { threshold: 0.3, limit: 5 });
      if (hits.length === 0) return [];

      const counts = await this.deps.supports.countByReports(hits.map((h) => h.reportId));
      const byId = new Map<ReportId, (typeof candidates)[number]>(candidates.map((c) => [c.id, c]));
      return hits.map((h) => ({
        id: h.reportId,
        title: byId.get(h.reportId)?.title ?? "",
        status: byId.get(h.reportId)?.status ?? "NEW",
        score: h.score,
        reasons: h.reasons,
        supportCount: counts.get(h.reportId) ?? 0,
      }));
    });
  }
}
