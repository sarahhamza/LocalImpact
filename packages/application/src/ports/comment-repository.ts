import type { Comment, ReportId } from "@acme/domain";

export interface CommentRepository {
  add(comment: Comment): Promise<void>;
  /** Du plus ancien au plus récent. */
  byReport(reportId: ReportId): Promise<Comment[]>;
}
