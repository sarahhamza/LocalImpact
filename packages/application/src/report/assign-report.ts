import { ReportId, UserId } from "@acme/domain";
import type { Clock, ReportRepository, UserRepository } from "../ports";
import type { Actor } from "../shared/actor";
import { assert, authorization } from "../shared/authorization";
import { Introuvable } from "../shared/errors";
import { guard, type Result } from "../shared/result";

export class AssignReport {
  constructor(private readonly deps: { reports: ReportRepository; users: UserRepository; clock: Clock }) {}

  execute(
    actor: Actor,
    input: { reportId: string; assigneeId: string },
  ): Promise<Result<{ assignedToId: string; assignedToName: string }>> {
    return guard(async () => {
      const { reports, users, clock } = this.deps;
      const assigneeId = UserId.of(input.assigneeId);
      assert(authorization.canAssign(actor, assigneeId));

      const report = await reports.byId(ReportId.of(input.reportId));
      if (!report) throw new Introuvable("Signalement");
      const assignee = await users.byId(assigneeId);
      if (!assignee) throw new Introuvable("Responsable");

      await reports.save(report.assignTo({ id: assignee.id, role: assignee.role }, clock.now()));
      return { assignedToId: assignee.id, assignedToName: assignee.name };
    });
  }
}
