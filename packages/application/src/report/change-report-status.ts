import { isReportStatus, ReportId, ValidationError } from "@acme/domain";
import type { Clock, ReportRepository, StatusHistoryRepository } from "../ports";
import type { Actor } from "../shared/actor";
import { assert, authorization } from "../shared/authorization";
import { Introuvable } from "../shared/errors";
import { guard, type Result } from "../shared/result";
import { persistTransition } from "./persist-transition";

export class ChangeReportStatus {
  constructor(private readonly deps: { reports: ReportRepository; history: StatusHistoryRepository; clock: Clock }) {}

  /** `description` = description d'intervention, obligatoire pour passer à RESOLVED. */
  execute(
    actor: Actor,
    input: { reportId: string; status: string; description?: string },
  ): Promise<Result<{ status: string }>> {
    return guard(async () => {
      const { reports, history, clock } = this.deps;
      if (!isReportStatus(input.status)) throw new ValidationError("status", "Statut inconnu");

      const report = await reports.byId(ReportId.of(input.reportId));
      if (!report) throw new Introuvable("Signalement");
      assert(authorization.canChangeStatus(actor, report));

      const transition = report.changeStatus(actor, input.status, clock.now(), input.description);
      await persistTransition({ reports, history }, transition);
      return { status: transition.report.status };
    });
  }
}
