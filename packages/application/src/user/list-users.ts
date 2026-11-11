import type { UserRepository } from "../ports";
import type { Actor } from "../shared/actor";
import { assert, authorization } from "../shared/authorization";
import { guard, type Result } from "../shared/result";
import { toUserDto, type UserDto } from "./user-dto";

export class ListUsers {
  constructor(private readonly deps: { users: UserRepository }) {}

  execute(actor: Actor): Promise<Result<UserDto[]>> {
    return guard(async () => {
      assert(authorization.canManageUsers(actor));
      return (await this.deps.users.list()).map(toUserDto);
    });
  }
}
