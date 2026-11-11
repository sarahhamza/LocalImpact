import { Email, User, UserId, type Role } from "@acme/domain";
import type { UserDoc } from "@acme/db";

export function userToDomain(d: UserDoc): User {
  return User.restore({
    id: UserId.of(d._id),
    name: d.name,
    email: Email.of(d.email),
    passwordHash: d.passwordHash,
    role: d.role as Role,
    createdAt: d.createdAt,
  });
}

export function userToDoc(u: User): UserDoc {
  return {
    _id: u.id,
    name: u.name,
    email: u.email,
    passwordHash: u.passwordHash,
    role: u.role,
    createdAt: u.createdAt,
  };
}
