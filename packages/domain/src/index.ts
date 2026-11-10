// shared
export { DomainError, ValidationError } from "./shared/domain-error";

// user
export { User, type UserProps } from "./user/user";
export { UserId } from "./user/user-id";
export { Email } from "./user/email";
export { ROLES, isRole, canBeAssigned, type Role } from "./user/role";
export type { ActorRef } from "./user/actor-ref";
export { RoleInvalide } from "./user/errors";

// report
export { Report, MIN_RESOLUTION_LENGTH, type ReportProps, type CreateReportInput, type Transition } from "./report/report";
export { ReportId } from "./report/report-id";
export {
  REPORT_STATUSES,
  isReportStatus,
  canTransition,
  allowedTransitions,
  isFinal,
  type ReportStatus,
} from "./report/report-status";
export { CATEGORIES, isCategory, type Category } from "./report/category";
export { Location } from "./report/location";
export {
  findSimilar,
  similarityScore,
  type SimilarReport,
  type ExistingReport,
  type SimilarityTarget,
  type DetectorOptions,
} from "./report/duplicate-detector";
export { TransitionInvalide, ResolutionSansDescription, ChangementStatutNonAutorise, AssignationInvalide } from "./report/errors";

// support / history / comment
export { Support } from "./support/support";
export { DejaSoutenu, SoutienImpossible } from "./support/errors";
export { StatusChange } from "./status-change/status-change";
export { Comment } from "./comment/comment";
export { CommentId } from "./comment/comment-id";
