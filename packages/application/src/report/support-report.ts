import { ReportId, Support } from "@acme/domain";
import type { Clock, ReportRepository, SupportRepository } from "../ports";
import type { Actor } from "../shared/actor";
import { Introuvable } from "../shared/errors";
import { guard, type Result } from "../shared/result";

export class SupportReport {
  constructor(private readonly deps: { reports: ReportRepository; supports: SupportRepository; clock: Clock }) {}

  execute(actor: Actor, reportId: string): Promise<Result<{ supportCount: number }>> {
    return guard(async () => {
      const { reports, supports, clock } = this.deps;
      const id = ReportId.of(reportId);
      const report = await reports.byId(id);
      if (!report) throw new Introuvable("Signalement");

      const existing = await supports.supportersOf(id);
      // Règle du domaine : un seul soutien par utilisateur (l'index unique en base garde la même règle)
      const support = Support.create({ report, userId: actor.id, existingSupporters: existing, now: clock.now() });
      await supports.add(support);
      return { supportCount: existing.length + 1 };
    });
  }
}
