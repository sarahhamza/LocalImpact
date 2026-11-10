import type { Role } from "./role";
import type { UserId } from "./user-id";

/** Qui agit : le minimum dont le domaine a besoin pour vérifier une règle de droit. */
export interface ActorRef {
  readonly id: UserId;
  readonly role: Role;
}
