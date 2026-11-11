import { ReportId } from "@acme/domain";
import type { CommentRepository, ReportRepository, UserRepository } from "../ports";
import type { Actor } from "../shared/actor";
import { Introuvable } from "../shared/errors";
import { guard, type Result } from "../shared/result";
import { toCommentDto, type CommentDto } from "./comment-dto";

export class ListComments {
  constructor(private readonly deps: { reports: ReportRepository; comments: CommentRepository; users: UserRepository }) {}

  execute(_actor: Actor, reportId: string): Promise<Result<CommentDto[]>> {
    return guard(async () => {
      const { reports, comments, users } = this.deps;
      const id = ReportId.of(reportId);
      if (!(await reports.byId(id))) throw new Introuvable("Signalement");
      const list = await comments.byReport(id);
      const names = await users.namesByIds([...new Set(list.map((c) => c.authorId))]);
      return list.map((c) => toCommentDto(c, names));
    });
  }
}
