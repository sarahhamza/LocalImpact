import { allowedTransitions, ReportId, type ReportStatus } from "@acme/domain";
import type {
  ReportRepository,
  StatusHistoryRepository,
  SupportRepository,
  UserRepository,
} from "../ports";
import type { Actor } from "../shared/actor";
import { Introuvable } from "../shared/errors";
import { guard, type Result } from "../shared/result";
import { toReportDto, toStatusChangeDto, type ReportDto, type StatusChangeDto } from "./report-dto";

export interface ReportDetail {
  report: ReportDto;
  history: StatusChangeDto[];
  supportedByMe: boolean;
  /** Ce que CET utilisateur peut faire (le web affiche/masque les boutons ; le serveur revérifie). */
  permissions: {
    canSupport: boolean;
    canAssign: boolean;
    canChangeStatus: boolean;
    nextStatuses: ReportStatus[];
  };
}

export class GetReport {
  constructor(
    private readonly deps: {
      reports: ReportRepository;
      users: UserRepository;
      supports: SupportRepository;
      history: StatusHistoryRepository;
    },
  ) {}

  execute(actor: Actor, reportId: string): Promise<Result<ReportDetail>> {
    return guard(async () => {
      const { reports, users, supports, history } = this.deps;
      const id = ReportId.of(reportId);
      const report = await reports.byId(id);
      if (!report) throw new Introuvable("Signalement");

      const [supporters, changes] = await Promise.all([supports.supportersOf(id), history.byReport(id)]);

      const ids = new Set([report.authorId, ...changes.map((c) => c.authorId)]);
      if (report.assignedToId) ids.add(report.assignedToId);
      const names = await users.namesByIds([...ids]);

      const supportedByMe = supporters.includes(actor.id);
      const canChangeStatus = report.canChangeStatus(actor);
      return {
        report: toReportDto(report, { supportCount: supporters.length, names }),
        history: changes.map((c) => toStatusChangeDto(c, names)),
        supportedByMe,
        permissions: {
          canSupport: report.status !== "RESOLVED" && !supportedByMe,
          canAssign: report.status !== "RESOLVED" && (actor.role === "ADMIN" || actor.role === "MANAGER"),
          canChangeStatus,
          nextStatuses: canChangeStatus ? [...allowedTransitions(report.status)] : [],
        },
      };
    });
  }
}
