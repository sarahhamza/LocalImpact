import { CommentModel, ReportModel, StatusHistoryModel, SupportModel, UserModel } from "./models";

/**
 * Index de l'application (idempotent : `createIndex` ne fait rien s'il existe déjà).
 *  - unique (reportId, userId) : un seul soutien par utilisateur, garanti PAR LA BASE
 *  - unique email : pas de doublon de compte, même en cas de course
 *  - texte (titre + description) : recherche plein texte
 *  - statut, catégorie... : filtres de la liste et du tableau de bord
 */
export async function ensureIndexes(): Promise<void> {
  await Promise.all([
    UserModel.collection.createIndex({ email: 1 }, { unique: true, name: "email_unique" }),

    ReportModel.collection.createIndex(
      { title: "text", description: "text" },
      { name: "report_text", default_language: "french", weights: { title: 3, description: 1 } },
    ),
    ReportModel.collection.createIndex({ status: 1 }, { name: "report_status" }),
    ReportModel.collection.createIndex({ category: 1 }, { name: "report_category" }),
    ReportModel.collection.createIndex({ assignedToId: 1 }, { name: "report_assigned" }),
    ReportModel.collection.createIndex({ authorId: 1 }, { name: "report_author" }),
    ReportModel.collection.createIndex({ createdAt: -1 }, { name: "report_created" }),

    SupportModel.collection.createIndex({ reportId: 1, userId: 1 }, { unique: true, name: "support_unique" }),
    StatusHistoryModel.collection.createIndex({ reportId: 1, at: 1 }, { name: "history_report" }),
    CommentModel.collection.createIndex({ reportId: 1, createdAt: 1 }, { name: "comment_report" }),
  ]);
}
