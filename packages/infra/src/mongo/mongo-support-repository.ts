import { DejaSoutenu, type ReportId, type Support, type UserId } from "@acme/domain";
import { SupportModel, type SupportDoc } from "@acme/db";
import type { SupportRepository } from "@acme/application";
import { isDuplicateKey, type Connect } from "./connect";

export class MongoSupportRepository implements SupportRepository {
  constructor(private readonly connect: Connect) {}

  /** Deux requêtes simultanées du même utilisateur : l'index unique en laisse passer une seule. */
  async add(support: Support): Promise<void> {
    await this.connect();
    try {
      await SupportModel.create({
        _id: `${support.reportId}:${support.userId}`,
        reportId: support.reportId,
        userId: support.userId,
        createdAt: support.createdAt,
      });
    } catch (e) {
      if (isDuplicateKey(e)) throw new DejaSoutenu();
      throw e;
    }
  }

  async supportersOf(reportId: ReportId): Promise<UserId[]> {
    await this.connect();
    const docs = await SupportModel.find({ reportId }, { userId: 1 }).lean<Pick<SupportDoc, "userId">[]>();
    return docs.map((d) => d.userId as UserId);
  }

  async countByReports(ids: readonly ReportId[]): Promise<Map<ReportId, number>> {
    const map = new Map<ReportId, number>(ids.map((id) => [id, 0]));
    if (ids.length === 0) return map;
    await this.connect();
    const rows = await SupportModel.aggregate<{ _id: string; n: number }>([
      { $match: { reportId: { $in: ids } } },
      { $group: { _id: "$reportId", n: { $sum: 1 } } },
    ]);
    for (const r of rows) map.set(r._id as ReportId, r.n);
    return map;
  }
}
