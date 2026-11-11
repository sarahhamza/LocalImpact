import { isCategory, isReportStatus, ValidationError } from "@acme/domain";
import type { ReportFilters, ReportRepository, UserRepository } from "../ports";
import type { Actor } from "../shared/actor";
import { normalizePage, type Page } from "../shared/pagination";
import { guard, type Result } from "../shared/result";
import { toReportDtos, type ReportDto } from "./report-dto";

export interface SearchReportsInput {
  query?: string;
  category?: string;
  location?: string;
  status?: string;
  /** « Mes signalements assignés » (page du responsable). */
  assignedToMe?: boolean;
  /** « Mes signalements ». */
  createdByMe?: boolean;
  page?: number;
  pageSize?: number;
}

export class SearchReports {
  constructor(private readonly deps: { reports: ReportRepository; users: UserRepository }) {}

  execute(actor: Actor, input: SearchReportsInput = {}): Promise<Result<Page<ReportDto>>> {
    return guard(async () => {
      const filters: ReportFilters = {};
      const query = input.query?.trim();
      const location = input.location?.trim();
      if (query) filters.query = query;
      if (location) filters.location = location;
      if (input.category) {
        if (!isCategory(input.category)) throw new ValidationError("category", "Catégorie inconnue");
        filters.category = input.category;
      }
      if (input.status) {
        if (!isReportStatus(input.status)) throw new ValidationError("status", "Statut inconnu");
        filters.status = input.status;
      }
      if (input.assignedToMe) filters.assignedToId = actor.id;
      if (input.createdByMe) filters.authorId = actor.id;

      const result = await this.deps.reports.search(filters, normalizePage(input));
      return { ...result, items: await toReportDtos(this.deps.users, result.items) };
    });
  }
}
