import type { Role, User, UserId } from "@acme/domain";
import type { UserRepository } from "../ports";

export class FakeUserRepository implements UserRepository {
  private readonly items = new Map<UserId, User>();

  async save(user: User) {
    this.items.set(user.id, user);
  }
  async byId(id: UserId) {
    return this.items.get(id) ?? null;
  }
  async byEmail(email: string) {
    return [...this.items.values()].find((u) => u.email === email) ?? null;
  }
  async list() {
    return [...this.items.values()];
  }
  async listByRoles(roles: readonly Role[]) {
    return [...this.items.values()].filter((u) => roles.includes(u.role));
  }
  async namesByIds(ids: readonly UserId[]) {
    const map = new Map<UserId, string>();
    for (const id of ids) {
      const u = this.items.get(id);
      if (u) map.set(id, u.name);
    }
    return map;
  }
}
