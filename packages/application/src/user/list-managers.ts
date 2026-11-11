import type { UserRepository } from "../ports";
import type { Actor } from "../shared/actor";
import { assert, authorization } from "../shared/authorization";
import { guard, type Result } from "../shared/result";
import { toUserDto, type UserDto } from "./user-dto";

/** Utilisateurs auxquels on peut assigner un signalement (responsables et administrateurs). */
export class ListManagers {
  constructor(private readonly deps: { users: UserRepository }) {}

  execute(actor: Actor): Promise<Result<UserDto[]>> {
    return guard(async () => {
      assert(authorization.canListManagers(actor));
      return (await this.deps.users.listByRoles(["MANAGER", "ADMIN"])).map(toUserDto);
    });
  }
}
