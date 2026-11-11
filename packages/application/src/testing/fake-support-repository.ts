import { DejaSoutenu, type ReportId, type Support, type UserId } from "@acme/domain";
import type { SupportRepository } from "../ports";

export class FakeSupportRepository implements SupportRepository {
  private readonly items: Support[] = [];

  /** Reproduit l'index unique (reportId, userId) de MongoDB. */
  async add(support: Support) {
    if (this.items.some((s) => s.reportId === support.reportId && s.userId === support.userId)) {
      throw new DejaSoutenu();
    }
    this.items.push(support);
  }
  async supportersOf(reportId: ReportId): Promise<UserId[]> {
    return this.items.filter((s) => s.reportId === reportId).map((s) => s.userId);
  }
  async countByReports(ids: readonly ReportId[]) {
    const map = new Map<ReportId, number>();
    for (const id of ids) map.set(id, this.items.filter((s) => s.reportId === id).length);
    return map;
  }
  countOf(reportId: ReportId): number {
    return this.items.filter((s) => s.reportId === reportId).length;
  }
}
