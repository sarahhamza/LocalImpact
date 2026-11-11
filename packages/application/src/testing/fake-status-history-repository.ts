import type { ReportId, StatusChange } from "@acme/domain";
import type { StatusHistoryRepository } from "../ports";

export class FakeStatusHistoryRepository implements StatusHistoryRepository {
  readonly items: StatusChange[] = [];
  async add(change: StatusChange) {
    this.items.push(change);
  }
  async byReport(reportId: ReportId) {
    return this.items.filter((c) => c.reportId === reportId).sort((a, b) => a.at.getTime() - b.at.getTime());
  }
}
