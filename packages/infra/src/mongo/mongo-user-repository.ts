import type { Role, User, UserId } from "@acme/domain";
import { UserModel, type UserDoc } from "@acme/db";
import { EmailDejaUtilise, type UserRepository } from "@acme/application";
import { isDuplicateKey, type Connect } from "./connect";
import { userToDoc, userToDomain } from "./user-mapper";

export class MongoUserRepository implements UserRepository {
  constructor(private readonly connect: Connect) {}

  async save(user: User): Promise<void> {
    await this.connect();
    const doc = userToDoc(user);
    try {
      await UserModel.replaceOne({ _id: doc._id }, doc, { upsert: true });
    } catch (e) {
      if (isDuplicateKey(e)) throw new EmailDejaUtilise(); // course entre deux inscriptions
      throw e;
    }
  }

  async byId(id: UserId): Promise<User | null> {
    await this.connect();
    const d = await UserModel.findById(id).lean<UserDoc>();
    return d ? userToDomain(d) : null;
  }

  async byEmail(email: string): Promise<User | null> {
    await this.connect();
    const d = await UserModel.findOne({ email }).lean<UserDoc>();
    return d ? userToDomain(d) : null;
  }

  async list(): Promise<User[]> {
    await this.connect();
    return (await UserModel.find().sort({ createdAt: 1 }).lean<UserDoc[]>()).map(userToDomain);
  }

  async listByRoles(roles: readonly Role[]): Promise<User[]> {
    await this.connect();
    return (await UserModel.find({ role: { $in: roles } }).sort({ name: 1 }).lean<UserDoc[]>()).map(userToDomain);
  }

  async namesByIds(ids: readonly UserId[]): Promise<Map<UserId, string>> {
    const map = new Map<UserId, string>();
    if (ids.length === 0) return map;
    await this.connect();
    const docs = await UserModel.find({ _id: { $in: ids } }, { name: 1 }).lean<Pick<UserDoc, "_id" | "name">[]>();
    for (const d of docs) map.set(d._id as UserId, d.name);
    return map;
  }
}
