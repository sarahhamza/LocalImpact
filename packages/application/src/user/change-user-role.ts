import { isRole, ValidationError, UserId } from "@acme/domain";
import type { UserRepository } from "../ports";
import type { Actor } from "../shared/actor";
import { assert, authorization } from "../shared/authorization";
import { Introuvable } from "../shared/errors";
import { guard, type Result } from "../shared/result";
import { toUserDto, type UserDto } from "./user-dto";

export class ChangeUserRole {
  constructor(private readonly deps: { users: UserRepository }) {}

  execute(actor: Actor, input: { userId: string; role: string }): Promise<Result<UserDto>> {
    return guard(async () => {
      assert(authorization.canManageUsers(actor));
      if (!isRole(input.role)) throw new ValidationError("role", "Rôle inconnu");
      const id = UserId.of(input.userId);
      // Garde-fou : un admin ne peut pas se retirer ses propres droits (risque de verrouillage)
      assert(id !== actor.id, "Vous ne pouvez pas modifier votre propre rôle");

      const user = await this.deps.users.byId(id);
      if (!user) throw new Introuvable("Utilisateur");
      const updated = user.changeRole(input.role);
      await this.deps.users.save(updated);
      return toUserDto(updated);
    });
  }
}
