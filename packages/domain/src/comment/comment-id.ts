import { assertNonEmptyId, newId } from "../shared/id";

export type CommentId = string & { readonly __brand: "CommentId" };

export const CommentId = {
  of: (value: string): CommentId => assertNonEmptyId(value, "commentId") as CommentId,
  generate: (): CommentId => newId() as CommentId,
};
