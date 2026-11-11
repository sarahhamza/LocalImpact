import {
  CATEGORIES,
  REPORT_STATUSES,
  ReportId,
  type ExistingReport,
  type Report,
  type SimilarityTarget,
  type Category,
  type ReportStatus,
} from "@acme/domain";
import { ReportModel, SupportModel, type ReportDoc } from "@acme/db";
import type {
  Page,
  PageRequest,
  ReportFilters,
  ReportListEntry,
  ReportRepository,
  ReportStats,
} from "@acme/application";
import { escapeRegex, type Connect } from "./connect";
import { reportToDoc, reportToDomain } from "./report-mapper";

export class MongoReportRepository implements ReportRepository {
  constructor(private readonly connect: Connect) {}

  async save(report: Report): Promise<void> {
    await this.connect();
    const doc = reportToDoc(report);
    await ReportModel.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }

  async byId(id: ReportId): Promise<Report | null> {
    await this.connect();
    const d = await ReportModel.findById(id).lean<ReportDoc>();
    return d ? reportToDomain(d) : null;
  }

  async search(filters: ReportFilters, page: PageRequest): Promise<Page<ReportListEntry>> {
    await this.connect();
    const q: Record<string, unknown> = {};
    if (filters.query) q["$text"] = { $search: filters.query, $language: "french" };
    if (filters.category) q["category"] = filters.category;
    if (filters.status) q["status"] = filters.status;
    if (filters.assignedToId) q["assignedToId"] = filters.assignedToId;
    if (filters.authorId) q["authorId"] = filters.authorId;
    if (filters.location) q["location"] = { $regex: escapeRegex(filters.location), $options: "i" };

    const [docs, total] = await Promise.all([
      ReportModel.find(q)
        .sort({ createdAt: -1, _id: 1 })
        .skip((page.page - 1) * page.pageSize)
        .limit(page.pageSize)
        .lean<ReportDoc[]>(),
      ReportModel.countDocuments(q),
    ]);

    const counts = await this.supportCounts(docs.map((d) => d._id));
    return {
      items: docs.map((d) => ({ report: reportToDomain(d), supportCount: counts.get(d._id) ?? 0 })),
      total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  /** Candidats : signalements ouverts de la même catégorie OU dont le titre partage un mot. */
  async findSimilar(target: SimilarityTarget, limit: number): Promise<ExistingReport[]> {
    await this.connect();
    const words = [...new Set(target.title.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 3))].slice(0, 6);
    const or: Record<string, unknown>[] = words.map((w) => ({ title: { $regex: escapeRegex(w), $options: "i" } }));
    if (target.category) or.push({ category: target.category });
    if (or.length === 0) return [];

    const docs = await ReportModel.find({ status: { $ne: "RESOLVED" }, $or: or })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<ReportDoc[]>();
    return docs.map((d) => ({
      id: ReportId.of(d._id),
      title: d.title,
      description: d.description,
      category: d.category,
      location: d.location,
      status: d.status as ReportStatus,
    }));
  }

  async stats(): Promise<ReportStats> {
    await this.connect();
    const [statusRows, categoryRows, resolved] = await Promise.all([
      ReportModel.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
      ReportModel.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$category", n: { $sum: 1 } } }]),
      ReportModel.find({ status: "RESOLVED", resolvedAt: { $ne: null } }, { createdAt: 1, resolvedAt: 1 }).lean<
        Pick<ReportDoc, "createdAt" | "resolvedAt">[]
      >(),
    ]);

    const byStatus = Object.fromEntries(REPORT_STATUSES.map((s) => [s, 0])) as Record<ReportStatus, number>;
    const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
    for (const r of statusRows) if (r._id in byStatus) byStatus[r._id as ReportStatus] = r.n;
    for (const r of categoryRows) if (r._id in byCategory) byCategory[r._id as Category] = r.n;

    return {
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      byStatus,
      byCategory,
      resolutionTimesMs: resolved.map((d) => d.resolvedAt!.getTime() - d.createdAt.getTime()),
    };
  }

  private async supportCounts(ids: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (ids.length === 0) return map;
    const rows = await SupportModel.aggregate<{ _id: string; n: number }>([
      { $match: { reportId: { $in: ids } } },
      { $group: { _id: "$reportId", n: { $sum: 1 } } },
    ]);
    for (const r of rows) map.set(r._id, r.n);
    return map;
  }
}
