import { Comment, ReportId } from "@acme/domain";
import type { Clock, CommentRepository, ReportRepository, UserRepository } from "../ports";
import type { Actor } from "../shared/actor";
import { Introuvable } from "../shared/errors";
import { guard, type Result } from "../shared/result";
import { toCommentDto, type CommentDto } from "./comment-dto";

export class AddComment {
  constructor(
    private readonly deps: { reports: ReportRepository; comments: CommentRepository; users: UserRepository; clock: Clock },
  ) {}

  execute(actor: Actor, input: { reportId: string; content: string }): Promise<Result<CommentDto>> {
    return guard(async () => {
      const { reports, comments, users, clock } = this.deps;
      const reportId = ReportId.of(input.reportId);
      if (!(await reports.byId(reportId))) throw new Introuvable("Signalement");

      const comment = Comment.create({ reportId, authorId: actor.id, content: input.content, now: clock.now() });
      await comments.add(comment);
      return toCommentDto(comment, await users.namesByIds([actor.id]));
    });
  }
}
