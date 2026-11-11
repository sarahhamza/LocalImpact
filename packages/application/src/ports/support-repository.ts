import type { ReportId, Support, UserId } from "@acme/domain";

export interface SupportRepository {
  /**
   * Enregistre un soutien. L'implémentation s'appuie sur l'index unique
   * (reportId, userId) et lève `DejaSoutenu` en cas de doublon (course entre deux requêtes).
   */
  add(support: Support): Promise<void>;
  supportersOf(reportId: ReportId): Promise<UserId[]>;
  countByReports(ids: readonly ReportId[]): Promise<Map<ReportId, number>>;
}
