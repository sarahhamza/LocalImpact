import type { Category, Report, ReportStatus, StatusChange, UserId } from "@acme/domain";
import type { ReportListEntry, UserRepository } from "../ports";

/** Objet simple et sérialisable (dates en ISO) : traverse sans souci la frontière serveur → client. */
export interface ReportDto {
  id: string;
  title: string;
  description: string;
  category: Category;
  location: string;
  photoUrl: string | null;
  status: ReportStatus;
  authorId: string;
  authorName: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  resolutionDescription: string | null;
  supportCount: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface StatusChangeDto {
  id: string;
  from: ReportStatus;
  to: ReportStatus;
  authorId: string;
  authorName: string | null;
  at: string;
  note: string | null;
}

export function toReportDto(
  r: Report,
  extra: { supportCount: number; names: Map<UserId, string> },
): ReportDto {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    location: r.location,
    photoUrl: r.photoUrl,
    status: r.status,
    authorId: r.authorId,
    authorName: extra.names.get(r.authorId) ?? null,
    assignedToId: r.assignedToId,
    assignedToName: r.assignedToId ? (extra.names.get(r.assignedToId) ?? null) : null,
    resolutionDescription: r.resolutionDescription,
    supportCount: extra.supportCount,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    resolvedAt: r.resolvedAt?.toISOString() ?? null,
  };
}

export function toStatusChangeDto(c: StatusChange, names: Map<UserId, string>): StatusChangeDto {
  return {
    id: c.id,
    from: c.from,
    to: c.to,
    authorId: c.authorId,
    authorName: names.get(c.authorId) ?? null,
    at: c.at.toISOString(),
    note: c.note,
  };
}

/** Enrichit une liste de signalements avec les noms (auteur, responsable) en UNE requête. */
export async function toReportDtos(users: UserRepository, entries: readonly ReportListEntry[]): Promise<ReportDto[]> {
  const ids = new Set<UserId>();
  for (const { report } of entries) {
    ids.add(report.authorId);
    if (report.assignedToId) ids.add(report.assignedToId);
  }
  const names = await users.namesByIds([...ids]);
  return entries.map((e) => toReportDto(e.report, { supportCount: e.supportCount, names }));
}
