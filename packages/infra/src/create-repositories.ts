import { connectMongo } from "@acme/db";
import { MongoCommentRepository } from "./mongo/mongo-comment-repository";
import { MongoReportRepository } from "./mongo/mongo-report-repository";
import { MongoStatusHistoryRepository } from "./mongo/mongo-status-history-repository";
import { MongoSupportRepository } from "./mongo/mongo-support-repository";
import { MongoUserRepository } from "./mongo/mongo-user-repository";

/**
 * Fabrique tous les repositories MongoDB branchés sur la même connexion (en cache).
 * C'est ce que le composition root (apps/web/src/container) appelle.
 */
export function createMongoRepositories(mongoUri: string) {
  const connect = () => connectMongo(mongoUri);
  return {
    users: new MongoUserRepository(connect),
    reports: new MongoReportRepository(connect),
    supports: new MongoSupportRepository(connect),
    history: new MongoStatusHistoryRepository(connect),
    comments: new MongoCommentRepository(connect),
  };
}
