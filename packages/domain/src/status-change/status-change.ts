import type { ReportId } from "../report/report-id";
import type { ReportStatus } from "../report/report-status";
import { newId } from "../shared/id";
import type { UserId } from "../user/user-id";

/** Entrée d'historique : ancien statut, nouveau statut, auteur, date. */
export interface StatusChange {
  readonly id: string;
  readonly reportId: ReportId;
  readonly from: ReportStatus;
  readonly to: ReportStatus;
  readonly authorId: UserId;
  readonly at: Date;
  /** Description d'intervention (obligatoire pour RESOLVED). */
  readonly note: string | null;
}

export const StatusChange = {
  create(input: Omit<StatusChange, "id" | "note"> & { note?: string | null }): StatusChange {
    return { id: newId(), ...input, note: input.note ?? null };
  },
};
