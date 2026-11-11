import type { Comment, UserId } from "@acme/domain";

export interface CommentDto {
  id: string;
  reportId: string;
  authorId: string;
  authorName: string | null;
  content: string;
  createdAt: string;
}

export const toCommentDto = (c: Comment, names: Map<UserId, string>): CommentDto => ({
  id: c.id,
  reportId: c.reportId,
  authorId: c.authorId,
  authorName: names.get(c.authorId) ?? null,
  content: c.content,
  createdAt: c.createdAt.toISOString(),
});
