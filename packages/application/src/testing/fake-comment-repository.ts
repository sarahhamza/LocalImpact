import type { Comment, ReportId } from "@acme/domain";
import type { CommentRepository } from "../ports";

export class FakeCommentRepository implements CommentRepository {
  readonly items: Comment[] = [];
  async add(comment: Comment) {
    this.items.push(comment);
  }
  async byReport(reportId: ReportId) {
    return this.items
      .filter((c) => c.reportId === reportId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
