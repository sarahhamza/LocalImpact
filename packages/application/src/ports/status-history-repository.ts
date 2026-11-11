import type { ReportId, StatusChange } from "@acme/domain";

export interface StatusHistoryRepository {
  add(change: StatusChange): Promise<void>;
  /** Historique d'un signalement, du plus ancien au plus récent. */
  byReport(reportId: ReportId): Promise<StatusChange[]>;
}
