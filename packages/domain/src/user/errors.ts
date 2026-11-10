import { DomainError } from "../shared/domain-error";

export class RoleInvalide extends DomainError {
  constructor(role: string) {
    super("ROLE_INVALIDE", `Rôle inconnu : ${role}`);
  }
}
