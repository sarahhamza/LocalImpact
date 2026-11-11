import {
  CATEGORIES,
  REPORT_STATUSES,
  type ExistingReport,
  type Report,
  type ReportId,
  type SimilarityTarget,
} from "@acme/domain";
import type { ReportFilters, ReportListEntry, ReportRepository, ReportStats } from "../ports";
import type { Page, PageRequest } from "../shared/pagination";
import type { FakeSupportRepository } from "./fake-support-repository";

export class FakeReportRepository implements ReportRepository {
  private readonly items = new Map<ReportId, Report>();

  constructor(private readonly supports?: FakeSupportRepository) {}

  async save(report: Report) {
    this.items.set(report.id, report);
  }
  async byId(id: ReportId) {
    return this.items.get(id) ?? null;
  }

  async search(filters: ReportFilters, page: PageRequest): Promise<Page<ReportListEntry>> {
    const words = (filters.query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    const matching = [...this.items.values()]
      .filter((r) => {
        if (filters.category && r.category !== filters.category) return false;
        if (filters.status && r.status !== filters.status) return false;
        if (filters.assignedToId && r.assignedToId !== filters.assignedToId) return false;
        if (filters.authorId && r.authorId !== filters.authorId) return false;
        if (filters.location && !r.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
        const text = `${r.title} ${r.description}`.toLowerCase();
        return words.every((w) => text.includes(w));
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const start = (page.page - 1) * page.pageSize;
    return {
      items: matching.slice(start, start + page.pageSize).map((report) => ({
        report,
        supportCount: this.supports?.countOf(report.id) ?? 0,
      })),
      total: matching.length,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  async findSimilar(_target: SimilarityTarget, limit: number): Promise<ExistingReport[]> {
    return [...this.items.values()].slice(0, limit).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      location: r.location,
      status: r.status,
    }));
  }

  async stats(): Promise<ReportStats> {
    const byStatus = Object.fromEntries(REPORT_STATUSES.map((s) => [s, 0])) as ReportStats["byStatus"];
    const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as ReportStats["byCategory"];
    const resolutionTimesMs: number[] = [];
    for (const r of this.items.values()) {
      byStatus[r.status]++;
      byCategory[r.category]++;
      const t = r.resolutionTimeMs();
      if (t !== null) resolutionTimesMs.push(t);
    }
    return { total: this.items.size, byStatus, byCategory, resolutionTimesMs };
  }
}
