// shared
export type { Actor } from "./shared/actor";
export { ok, fail, guard, toFailure, type Result, type Failure } from "./shared/result";
export { AppError, NonAutorise, Introuvable, IdentifiantsInvalides, EmailDejaUtilise } from "./shared/errors";
export { authorization } from "./shared/authorization";
export { normalizePage, MAX_PAGE_SIZE, type Page, type PageRequest } from "./shared/pagination";

// ports
export type * from "./ports";

// user
export { RegisterUser, type RegisterUserInput } from "./user/register-user";
export { AuthenticateUser } from "./user/authenticate-user";
export { ListUsers } from "./user/list-users";
export { ChangeUserRole } from "./user/change-user-role";
export { ListManagers } from "./user/list-managers";
export type { UserDto } from "./user/user-dto";

// report
export { CreateReport, type CreateReportInput } from "./report/create-report";
export { GetReport, type ReportDetail } from "./report/get-report";
export { SearchReports, type SearchReportsInput } from "./report/search-reports";
export { FindSimilarReports, type SimilarReportDto } from "./report/find-similar-reports";
export { SupportReport } from "./report/support-report";
export { AssignReport } from "./report/assign-report";
export { ChangeReportStatus } from "./report/change-report-status";
export { ResolveReport } from "./report/resolve-report";
export type { ReportDto, StatusChangeDto } from "./report/report-dto";

// comment
export { AddComment } from "./comment/add-comment";
export { ListComments } from "./comment/list-comments";
export type { CommentDto } from "./comment/comment-dto";

// dashboard
export { GetDashboardStats, summarizeResolution, type DashboardStats } from "./dashboard/get-dashboard-stats";
