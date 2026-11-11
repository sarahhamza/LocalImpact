import { Email } from "@acme/domain";
import type { PasswordHasher, UserRepository } from "../ports";
import { IdentifiantsInvalides } from "../shared/errors";
import { guard, type Result } from "../shared/result";
import { toUserDto, type UserDto } from "./user-dto";

export class AuthenticateUser {
  constructor(private readonly deps: { users: UserRepository; hasher: PasswordHasher }) {}

  execute(input: { email: string; password: string }): Promise<Result<UserDto>> {
    return guard(async () => {
      const { users, hasher } = this.deps;
      let email: string;
      try {
        email = Email.of(input.email);
      } catch {
        throw new IdentifiantsInvalides(); // même message : ne révèle rien sur les comptes
      }
      const user = await users.byEmail(email);
      const valid = user ? await hasher.verify(input.password ?? "", user.passwordHash) : false;
      if (!user || !valid) throw new IdentifiantsInvalides();
      return toUserDto(user);
    });
  }
}
