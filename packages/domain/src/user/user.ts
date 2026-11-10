import { ValidationError } from "../shared/domain-error";
import { Email } from "./email";
import { RoleInvalide } from "./errors";
import { isRole, type Role } from "./role";
import { UserId } from "./user-id";

export interface UserProps {
  id: UserId;
  name: string;
  email: Email;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  /** Inscription : le rôle par défaut est toujours USER. */
  static register(input: { id?: UserId; name: string; email: string; passwordHash: string; now: Date }): User {
    const name = (input.name ?? "").trim();
    if (name.length < 2 || name.length > 80) {
      throw new ValidationError("name", "Le nom doit contenir entre 2 et 80 caractères");
    }
    if (!input.passwordHash) throw new ValidationError("password", "Mot de passe manquant");
    return new User({
      id: input.id ?? UserId.generate(),
      name,
      email: Email.of(input.email),
      passwordHash: input.passwordHash,
      role: "USER",
      createdAt: input.now,
    });
  }

  /** Reconstitution depuis la base (aucune règle rejouée). */
  static restore(props: UserProps): User {
    return new User({ ...props });
  }

  changeRole(role: string): User {
    if (!isRole(role)) throw new RoleInvalide(role);
    return new User({ ...this.props, role });
  }

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get email() { return this.props.email; }
  get passwordHash() { return this.props.passwordHash; }
  get role() { return this.props.role; }
  get createdAt() { return this.props.createdAt; }

  toProps(): UserProps {
    return { ...this.props };
  }
}
