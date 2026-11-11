import { Location, Report, ReportId, UserId, type Category, type ReportStatus } from "@acme/domain";
import type { ReportDoc } from "@acme/db";

export function reportToDomain(d: ReportDoc): Report {
  return Report.restore({
    id: ReportId.of(d._id),
    title: d.title,
    description: d.description,
    category: d.category as Category,
    location: Location.of(d.location),
    photoUrl: d.photoUrl ?? null,
    authorId: UserId.of(d.authorId),
    assignedToId: d.assignedToId ? UserId.of(d.assignedToId) : null,
    status: d.status as ReportStatus,
    resolutionDescription: d.resolutionDescription ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    resolvedAt: d.resolvedAt ?? null,
  });
}

export function reportToDoc(r: Report): ReportDoc {
  return {
    _id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    location: r.location,
    photoUrl: r.photoUrl,
    authorId: r.authorId,
    assignedToId: r.assignedToId,
    status: r.status,
    resolutionDescription: r.resolutionDescription,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    resolvedAt: r.resolvedAt,
  };
}
