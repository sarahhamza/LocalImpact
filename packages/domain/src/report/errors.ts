import { DomainError } from "../shared/domain-error";
import type { ReportStatus } from "./report-status";

export class TransitionInvalide extends DomainError {
  constructor(readonly from: ReportStatus, readonly to: ReportStatus) {
    super("TRANSITION_INVALIDE", `Transition interdite : ${from} → ${to}`);
  }
}

export class ResolutionSansDescription extends DomainError {
  constructor() {
    super("RESOLUTION_SANS_DESCRIPTION", "La résolution nécessite une description de l'intervention");
  }
}

export class ChangementStatutNonAutorise extends DomainError {
  constructor() {
    super("STATUT_NON_AUTORISE", "Seul le responsable assigné ou un administrateur peut changer le statut");
  }
}

export class AssignationInvalide extends DomainError {
  constructor(reason: string) {
    super("ASSIGNATION_INVALIDE", reason);
  }
}
