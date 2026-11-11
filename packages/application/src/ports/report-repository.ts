import type {
  Category,
  ExistingReport,
  Report,
  ReportId,
  ReportStatus,
  SimilarityTarget,
  UserId,
} from "@acme/domain";
import type { Page, PageRequest } from "../shared/pagination";

export interface ReportFilters {
  /** Recherche plein texte (titre + description). */
  query?: string;
  category?: Category;
  /** Sous-chaîne du lieu, insensible à la casse. */
  location?: string;
  status?: ReportStatus;
  assignedToId?: UserId;
  authorId?: UserId;
}

/** Un signalement + son nombre de soutiens (calculé par le repository : jamais stocké). */
export interface ReportListEntry {
  report: Report;
  supportCount: number;
}

export interface ReportStats {
  total: number;
  byStatus: Record<ReportStatus, number>;
  byCategory: Record<Category, number>;
  /** Délais de résolution (ms) de tous les signalements résolus. */
  resolutionTimesMs: number[];
}

export interface ReportRepository {
  save(report: Report): Promise<void>;
  byId(id: ReportId): Promise<Report | null>;
  search(filters: ReportFilters, page: PageRequest): Promise<Page<ReportListEntry>>;
  /**
   * Candidats « doublon » pré-filtrés (même catégorie, mots communs...) ;
   * le score de similarité est calculé ensuite par le domaine.
   */
  findSimilar(target: SimilarityTarget, limit: number): Promise<ExistingReport[]>;
  stats(): Promise<ReportStats>;
}
