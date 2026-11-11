import type { Role, User, UserId } from "@acme/domain";

export interface UserRepository {
  save(user: User): Promise<void>;
  byId(id: UserId): Promise<User | null>;
  byEmail(email: string): Promise<User | null>;
  list(): Promise<User[]>;
  listByRoles(roles: readonly Role[]): Promise<User[]>;
  /** Noms d'affichage (évite N requêtes pour enrichir les listes). */
  namesByIds(ids: readonly UserId[]): Promise<Map<UserId, string>>;
}
