import {
  AddComment, AssignReport, AuthenticateUser, ChangeReportStatus, ChangeUserRole, CreateReport, GetDashboardStats,
  GetReport, ListComments, RegisterUser, ResolveReport, SearchReports, SupportReport,
  type Actor, type Result,
} from "@acme/application";
import { FakeClock, FakePhotoStorage } from "@acme/application/testing";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BcryptPasswordHasher } from "../security/bcrypt-password-hasher";
import { MongoCommentRepository } from "./mongo-comment-repository";
import { MongoReportRepository } from "./mongo-report-repository";
import { MongoStatusHistoryRepository } from "./mongo-status-history-repository";
import { MongoSupportRepository } from "./mongo-support-repository";
import { MongoUserRepository } from "./mongo-user-repository";
import { openTestDb } from "./test-db";

/** Les vrais use cases sur la vraie base : c'est le scénario métier complet du sujet. */
let db: Awaited<ReturnType<typeof openTestDb>>;
const clock = new FakeClock();
const hasher = new BcryptPasswordHasher(4);
const photos = new FakePhotoStorage();
let d: ReturnType<typeof build>;

function build() {
  const users = new MongoUserRepository(db.connect);
  const reports = new MongoReportRepository(db.connect);
  const supports = new MongoSupportRepository(db.connect);
  const history = new MongoStatusHistoryRepository(db.connect);
  const comments = new MongoCommentRepository(db.connect);
  return {
    register: new RegisterUser({ users, hasher, clock }),
    login: new AuthenticateUser({ users, hasher }),
    changeRole: new ChangeUserRole({ users }),
    create: new CreateReport({ reports, users, photos, clock }),
    get: new GetReport({ reports, users, supports, history }),
    search: new SearchReports({ reports, users }),
    support: new SupportReport({ reports, supports, clock }),
    assign: new AssignReport({ reports, users, clock }),
    status: new ChangeReportStatus({ reports, history, clock }),
    resolve: new ResolveReport({ reports, history, clock }),
    addComment: new AddComment({ reports, comments, users, clock }),
    listComments: new ListComments({ reports, comments, users }),
    dashboard: new GetDashboardStats({ reports }),
  };
}

beforeAll(async () => { db = await openTestDb(); d = build(); });
afterAll(() => db.close());
beforeEach(() => db.clear());

const ok = <T>(r: Result<T>): T => { if (!r.ok) throw new Error(`${r.error.code}: ${r.error.message}`); return r.value; };
async function signUp(name: string, role: Actor["role"] = "USER", admin?: Actor): Promise<Actor> {
  const dto = ok(await d.register.execute({ name, email: `${name.toLowerCase()}@test.tn`, password: "motdepasse1" }));
  if (role !== "USER") ok(await d.changeRole.execute(admin!, { userId: dto.id, role }));
  return { id: dto.id as Actor["id"], role };
}
async function bootstrapAdmin(): Promise<Actor> {
  const dto = ok(await d.register.execute({ name: "Root", email: "root@test.tn", password: "motdepasse1" }));
  const { UserModel } = await import("@acme/db");
  await UserModel.updateOne({ _id: dto.id }, { role: "ADMIN" });
  return { id: dto.id as Actor["id"], role: "ADMIN" };
}

describe("parcours complet sur MongoDB", () => {
  it("inscription, connexion, e-mail unique même en cas de course", async () => {
    const input = { name: "Sara", email: "sara@test.tn", password: "motdepasse1" };
    const [a, b] = await Promise.all([d.register.execute(input), d.register.execute(input)]);
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    const failed = [a, b].find((r) => !r.ok)!;
    expect(!failed.ok && failed.error.code).toBe("EMAIL_DEJA_UTILISE");
    expect(ok(await d.login.execute({ email: "sara@test.tn", password: "motdepasse1" })).role).toBe("USER");
    expect((await d.login.execute({ email: "sara@test.tn", password: "faux" })).ok).toBe(false);
  });

  it("deux soutiens simultanés du même utilisateur : un seul est enregistré", async () => {
    const amel = await signUp("Amel");
    const report = ok(await d.create.execute(amel, { title: "Lampe cassée", description: "Couloir B, plus de lumière.", category: "LIGHTING", location: "Bâtiment B" }));
    const [x, y] = await Promise.all([d.support.execute(amel, report.id), d.support.execute(amel, report.id)]);
    expect([x.ok, y.ok].filter(Boolean)).toHaveLength(1);
    expect(ok(await d.get.execute(amel, report.id)).report.supportCount).toBe(1);
  });

  it("créer → soutenir → assigner → statuts → résoudre, historique et statistiques cohérents", async () => {
    const admin = await bootstrapAdmin();
    const amel = await signUp("Amel");
    const bilel = await signUp("Bilel");
    const karim = await signUp("Karim", "MANAGER", admin);

    const r = ok(await d.create.execute(amel, { title: "Lampe cassée couloir", description: "Le couloir du bâtiment B est dans le noir.", category: "LIGHTING", location: "Bâtiment B" }));
    ok(await d.support.execute(bilel, r.id));
    ok(await d.assign.execute(admin, { reportId: r.id, assigneeId: karim.id }));

    // un utilisateur ne peut pas changer le statut ; le responsable assigné, si
    expect((await d.status.execute(amel, { reportId: r.id, status: "TAKEN" })).ok).toBe(false);
    clock.advance(60_000);
    ok(await d.status.execute(karim, { reportId: r.id, status: "TAKEN" }));
    clock.advance(60_000);
    ok(await d.status.execute(karim, { reportId: r.id, status: "IN_PROGRESS" }));
    const noDesc = await d.resolve.execute(karim, { reportId: r.id, description: "" });
    expect(!noDesc.ok && noDesc.error.code).toBe("RESOLUTION_SANS_DESCRIPTION");
    clock.advance(3_600_000);
    ok(await d.resolve.execute(karim, { reportId: r.id, description: "Ampoule remplacée et test effectué" }));

    ok(await d.addComment.execute(amel, { reportId: r.id, content: "Merci !" }));
    expect(ok(await d.listComments.execute(amel, r.id)).map((c) => c.authorName)).toEqual(["Amel"]);

    const detail = ok(await d.get.execute(amel, r.id));
    expect(detail.report).toMatchObject({ status: "RESOLVED", supportCount: 1, assignedToName: "Karim", authorName: "Amel" });
    expect(detail.history.map((h) => `${h.from}>${h.to}`)).toEqual(["NEW>TAKEN", "TAKEN>IN_PROGRESS", "IN_PROGRESS>RESOLVED"]);
    expect(detail.history.every((h) => h.authorName === "Karim")).toBe(true);

    const stats = ok(await d.dashboard.execute(karim));
    expect(stats).toMatchObject({ total: 1, byStatus: { RESOLVED: 1, NEW: 0 }, byCategory: { LIGHTING: 1 } });
    expect(stats.resolution).toMatchObject({ resolvedCount: 1 });
    expect((await d.dashboard.execute(amel)).ok).toBe(false);

    const found = ok(await d.search.execute(amel, { query: "couloir", status: "RESOLVED" }));
    expect(found.total).toBe(1);
  });
});
