import { Comment, DejaSoutenu, ReportId, StatusChange, UserId } from "@acme/domain";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoCommentRepository } from "./mongo-comment-repository";
import { MongoStatusHistoryRepository } from "./mongo-status-history-repository";
import { MongoSupportRepository } from "./mongo-support-repository";
import { openTestDb } from "./test-db";

let db: Awaited<ReturnType<typeof openTestDb>>;
let supports: MongoSupportRepository;
let history: MongoStatusHistoryRepository;
let comments: MongoCommentRepository;
beforeAll(async () => {
  db = await openTestDb();
  supports = new MongoSupportRepository(db.connect);
  history = new MongoStatusHistoryRepository(db.connect);
  comments = new MongoCommentRepository(db.connect);
});
afterAll(() => db.close());
beforeEach(() => db.clear());

const reportId = ReportId.generate();
const at = (s: number) => new Date(Date.UTC(2026, 0, 1, 10, 0, s));

describe("MongoSupportRepository", () => {
  it("un seul soutien par utilisateur : l'index unique lève DejaSoutenu", async () => {
    const u = UserId.generate();
    await supports.add({ reportId, userId: u, createdAt: at(0) });
    await expect(supports.add({ reportId, userId: u, createdAt: at(1) })).rejects.toBeInstanceOf(DejaSoutenu);
    expect(await supports.supportersOf(reportId)).toEqual([u]);
  });
  it("le même utilisateur peut soutenir deux signalements différents", async () => {
    const u = UserId.generate(); const other = ReportId.generate();
    await supports.add({ reportId, userId: u, createdAt: at(0) });
    await supports.add({ reportId: other, userId: u, createdAt: at(0) });
    expect((await supports.countByReports([reportId, other, ReportId.generate()])).size).toBe(3);
  });
  it("compte les soutiens par signalement (0 par défaut)", async () => {
    const empty = ReportId.generate();
    await supports.add({ reportId, userId: UserId.generate(), createdAt: at(0) });
    await supports.add({ reportId, userId: UserId.generate(), createdAt: at(1) });
    const counts = await supports.countByReports([reportId, empty]);
    expect(counts.get(reportId)).toBe(2);
    expect(counts.get(empty)).toBe(0);
  });
});

describe("MongoStatusHistoryRepository", () => {
  it("renvoie l'historique du plus ancien au plus récent, avec auteur, date et note", async () => {
    const author = UserId.generate();
    const c2 = StatusChange.create({ reportId, from: "TAKEN", to: "IN_PROGRESS", authorId: author, at: at(20) });
    const c1 = StatusChange.create({ reportId, from: "NEW", to: "TAKEN", authorId: author, at: at(10) });
    const c3 = StatusChange.create({ reportId, from: "IN_PROGRESS", to: "RESOLVED", authorId: author, at: at(30), note: "Réparé" });
    for (const c of [c2, c3, c1]) await history.add(c); // ordre d'insertion mélangé
    await history.add(StatusChange.create({ reportId: ReportId.generate(), from: "NEW", to: "TAKEN", authorId: author, at: at(5) }));

    const list = await history.byReport(reportId);
    expect(list).toEqual([c1, c2, c3]);
  });
});

describe("MongoCommentRepository", () => {
  it("liste les commentaires d'un signalement par ordre chronologique", async () => {
    const a = UserId.generate();
    const c2 = Comment.create({ reportId, authorId: a, content: "Deuxième", now: at(20) });
    const c1 = Comment.create({ reportId, authorId: a, content: "Premier", now: at(10) });
    await comments.add(c2); await comments.add(c1);
    await comments.add(Comment.create({ reportId: ReportId.generate(), authorId: a, content: "Ailleurs", now: at(0) }));
    expect(await comments.byReport(reportId)).toEqual([c1, c2]);
  });
});
