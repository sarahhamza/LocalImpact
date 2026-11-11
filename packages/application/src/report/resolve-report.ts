import { ReportId } from "@acme/domain";
import type { Clock, ReportRepository, StatusHistoryRepository } from "../ports";
import type { Actor } from "../shared/actor";
import { assert, authorization } from "../shared/authorization";
import { Introuvable } from "../shared/errors";
import { guard, type Result } from "../shared/result";
import { persistTransition } from "./persist-transition";

/** Clôture un signalement « en cours » avec la description de l'intervention (obligatoire). */
export class ResolveReport {
  constructor(private readonly deps: { reports: ReportRepository; history: StatusHistoryRepository; clock: Clock }) {}

  execute(actor: Actor, input: { reportId: string; description: string }): Promise<Result<{ resolvedAt: string }>> {
    return guard(async () => {
      const { reports, history, clock } = this.deps;
      const report = await reports.byId(ReportId.of(input.reportId));
      if (!report) throw new Introuvable("Signalement");
      assert(authorization.canChangeStatus(actor, report));

      const transition = report.resolve(actor, input.description, clock.now());
      await persistTransition({ reports, history }, transition);
      return { resolvedAt: transition.change.at.toISOString() };
    });
  }
}
