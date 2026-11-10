import { assertNonEmptyId, newId } from "../shared/id";

export type ReportId = string & { readonly __brand: "ReportId" };

export const ReportId = {
  of: (value: string): ReportId => assertNonEmptyId(value, "reportId") as ReportId,
  generate: (): ReportId => newId() as ReportId,
};
