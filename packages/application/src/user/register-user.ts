import { User, ValidationError } from "@acme/domain";
import type { Clock, PasswordHasher, UserRepository } from "../ports";
import { EmailDejaUtilise } from "../shared/errors";
import { guard, type Result } from "../shared/result";
import { toUserDto, type UserDto } from "./user-dto";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export class RegisterUser {
  constructor(private readonly deps: { users: UserRepository; hasher: PasswordHasher; clock: Clock }) {}

  execute(input: RegisterUserInput): Promise<Result<UserDto>> {
    return guard(async () => {
      const { users, hasher, clock } = this.deps;
      if (typeof input.password !== "string" || input.password.length < 8 || input.password.length > 72) {
        throw new ValidationError("password", "Le mot de passe doit contenir entre 8 et 72 caractères");
      }
      // Validation du nom / e-mail par le domaine AVANT de toucher la base
      const user = User.register({
        name: input.name,
        email: input.email,
        passwordHash: "pending",
        now: clock.now(),
      });
      if (await users.byEmail(user.email)) throw new EmailDejaUtilise();

      const hashed = User.restore({ ...user.toProps(), passwordHash: await hasher.hash(input.password) });
      await users.save(hashed);
      return toUserDto(hashed);
    });
  }
}
