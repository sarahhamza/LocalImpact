import { CommentId, ReportId, UserId, type Comment } from "@acme/domain";
import { CommentModel, type CommentDoc } from "@acme/db";
import type { CommentRepository } from "@acme/application";
import type { Connect } from "./connect";

export class MongoCommentRepository implements CommentRepository {
  constructor(private readonly connect: Connect) {}

  async add(c: Comment): Promise<void> {
    await this.connect();
    await CommentModel.create({
      _id: c.id,
      reportId: c.reportId,
      authorId: c.authorId,
      content: c.content,
      createdAt: c.createdAt,
    });
  }

  async byReport(reportId: ReportId): Promise<Comment[]> {
    await this.connect();
    const docs = await CommentModel.find({ reportId }).sort({ createdAt: 1, _id: 1 }).lean<CommentDoc[]>();
    return docs.map((d) => ({
      id: CommentId.of(d._id),
      reportId: ReportId.of(d.reportId),
      authorId: UserId.of(d.authorId),
      content: d.content,
      createdAt: d.createdAt,
    }));
  }
}
