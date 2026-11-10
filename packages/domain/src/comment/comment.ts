import type { ReportId } from "../report/report-id";
import { ValidationError } from "../shared/domain-error";
import type { UserId } from "../user/user-id";
import { CommentId } from "./comment-id";

export interface Comment {
  readonly id: CommentId;
  readonly reportId: ReportId;
  readonly authorId: UserId;
  readonly content: string;
  readonly createdAt: Date;
}

export const Comment = {
  create(input: { id?: CommentId; reportId: ReportId; authorId: UserId; content: string; now: Date }): Comment {
    const content = (input.content ?? "").trim();
    if (content.length < 1 || content.length > 1000) {
      throw new ValidationError("content", "Le commentaire doit contenir entre 1 et 1000 caractères");
    }
    return {
      id: input.id ?? CommentId.generate(),
      reportId: input.reportId,
      authorId: input.authorId,
      content,
      createdAt: input.now,
    };
  },
};
