import { DomainError } from "../shared/domain-error";

export class DejaSoutenu extends DomainError {
  constructor() {
    super("DEJA_SOUTENU", "Vous soutenez déjà ce signalement");
  }
}

export class SoutienImpossible extends DomainError {
  constructor() {
    super("SOUTIEN_IMPOSSIBLE", "Un signalement résolu ne peut plus être soutenu");
  }
}
