import { randomUUID } from "node:crypto";
import {
  CommentModel,
  connectMongo,
  disconnectMongo,
  ReportModel,
  StatusHistoryModel,
  SupportModel,
  UserModel,
} from "@acme/db";

/** Base jetable (une par fichier de test) sur le mongod en mémoire. */
export async function openTestDb() {
  const base = process.env["MONGO_TEST_URI"];
  if (!base) throw new Error("MONGO_TEST_URI absent : le globalSetup de vitest n'a pas démarré MongoDB");
  const uri = `${base}/t_${randomUUID().slice(0, 8)}`;
  await connectMongo(uri);
  return {
    uri,
    connect: () => connectMongo(uri),
    async clear() {
      await Promise.all([
        UserModel.deleteMany({}),
        ReportModel.deleteMany({}),
        SupportModel.deleteMany({}),
        StatusHistoryModel.deleteMany({}),
        CommentModel.deleteMany({}),
      ]);
    },
    close: () => disconnectMongo(),
  };
}
