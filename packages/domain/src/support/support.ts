import type { ReportId } from "../report/report-id";
import type { ReportStatus } from "../report/report-status";
import type { UserId } from "../user/user-id";
import { DejaSoutenu, SoutienImpossible } from "./errors";

export interface Support {
  readonly reportId: ReportId;
  readonly userId: UserId;
  readonly createdAt: Date;
}

export const Support = {
  /**
   * Règle : un utilisateur ne soutient un signalement qu'une seule fois
   * (doublée en base par l'index unique (reportId, userId)).
   */
  create(input: {
    report: { id: ReportId; status: ReportStatus };
    userId: UserId;
    existingSupporters: readonly UserId[];
    now: Date;
  }): Support {
    if (input.report.status === "RESOLVED") throw new SoutienImpossible();
    if (input.existingSupporters.includes(input.userId)) throw new DejaSoutenu();
    return { reportId: input.report.id, userId: input.userId, createdAt: input.now };
  },
};
