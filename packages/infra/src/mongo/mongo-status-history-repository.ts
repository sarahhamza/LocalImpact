import { ReportId, UserId, type ReportStatus, type StatusChange } from "@acme/domain";
import { StatusHistoryModel, type StatusHistoryDoc } from "@acme/db";
import type { StatusHistoryRepository } from "@acme/application";
import type { Connect } from "./connect";

export class MongoStatusHistoryRepository implements StatusHistoryRepository {
  constructor(private readonly connect: Connect) {}

  async add(c: StatusChange): Promise<void> {
    await this.connect();
    await StatusHistoryModel.create({
      _id: c.id,
      reportId: c.reportId,
      from: c.from,
      to: c.to,
      authorId: c.authorId,
      at: c.at,
      note: c.note,
    });
  }

  async byReport(reportId: ReportId): Promise<StatusChange[]> {
    await this.connect();
    const docs = await StatusHistoryModel.find({ reportId }).sort({ at: 1, _id: 1 }).lean<StatusHistoryDoc[]>();
    return docs.map((d) => ({
      id: d._id,
      reportId: ReportId.of(d.reportId),
      from: d.from as ReportStatus,
      to: d.to as ReportStatus,
      authorId: UserId.of(d.authorId),
      at: d.at,
      note: d.note ?? null,
    }));
  }
}
