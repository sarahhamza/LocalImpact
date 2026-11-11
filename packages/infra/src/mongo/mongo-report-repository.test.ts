import { Report, UserId, type ReportId } from "@acme/domain";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoReportRepository } from "./mongo-report-repository";
import { MongoSupportRepository } from "./mongo-support-repository";
import { openTestDb } from "./test-db";

let db: Awaited<ReturnType<typeof openTestDb>>;
let reports: MongoReportRepository;
let supports: MongoSupportRepository;
const author = UserId.generate();
const manager = { id: UserId.generate(), role: "MANAGER" as const };
let t = new Date("2026-01-01T10:00:00Z").getTime();

beforeAll(async () => {
  db = await openTestDb();
  reports = new MongoReportRepository(db.connect);
  supports = new MongoSupportRepository(db.connect);
});
afterAll(() => db.close());
beforeEach(async () => {
  await db.clear();
  t = new Date("2026-01-01T10:00:00Z").getTime();
});

async function seed(title: string, over: Partial<{ category: string; location: string; description: string }> = {}) {
  t += 60_000; // chaque signalement est créé une minute après le précédent
  const r = Report.create({
    title,
    description: over.description ?? "Description détaillée du problème constaté.",
    category: over.category ?? "LIGHTING",
    location: over.location ?? "Bâtiment B",
    authorId: author,
    now: new Date(t),
  });
  await reports.save(r);
  return r;
}
const page = (p = 1, pageSize = 10) => ({ page: p, pageSize });

describe("MongoReportRepository", () => {
  it("sauvegarde et relit un signalement à l'identique (aller-retour)", async () => {
    const r = (await seed("Lampe cassée")).assignTo(manager, new Date(t));
    await reports.save(r);
    const loaded = (await reports.byId(r.id))!;
    expect(loaded.toProps()).toEqual(r.toProps());
    expect(await reports.byId("inconnu" as ReportId)).toBeNull();
  });

  it("save est un upsert : la 2e sauvegarde met à jour sans dupliquer", async () => {
    const r = await seed("Lampe cassée");
    const { report } = r.assignTo(manager, new Date(t)).changeStatus(manager, "TAKEN", new Date(t + 1000));
    await reports.save(report);
    expect((await reports.search({}, page())).total).toBe(1);
    expect((await reports.byId(r.id))!.status).toBe("TAKEN");
  });

  it("liste du plus récent au plus ancien, avec pagination", async () => {
    await seed("Premier"); await seed("Deuxième"); await seed("Troisième");
    const p1 = await reports.search({}, page(1, 2));
    expect(p1.total).toBe(3);
    expect(p1.items.map((i) => i.report.title)).toEqual(["Troisième", "Deuxième"]);
    expect((await reports.search({}, page(2, 2))).items.map((i) => i.report.title)).toEqual(["Premier"]);
  });

  it("filtre par catégorie, statut, lieu (insensible à la casse) et responsable", async () => {
    await seed("Lampe", { category: "LIGHTING", location: "Bâtiment B" });
    const wifi = await seed("Wifi", { category: "IT", location: "Bibliothèque" });
    await reports.save(wifi.assignTo(manager, new Date(t)));

    expect((await reports.search({ category: "IT" }, page())).items.map((i) => i.report.title)).toEqual(["Wifi"]);
    expect((await reports.search({ status: "NEW" }, page())).total).toBe(2);
    expect((await reports.search({ status: "TAKEN" }, page())).total).toBe(0);
    expect((await reports.search({ location: "biblio" }, page())).total).toBe(1);
    expect((await reports.search({ assignedToId: manager.id }, page())).total).toBe(1);
    expect((await reports.search({ authorId: author }, page())).total).toBe(2);
  });

  it("neutralise les caractères spéciaux dans le filtre de lieu (pas d'injection de regex)", async () => {
    await seed("Lampe", { location: "Bâtiment (B)" });
    expect((await reports.search({ location: "(B)" }, page())).total).toBe(1);
    expect((await reports.search({ location: ".*" }, page())).total).toBe(0);
  });

  it("recherche plein texte (français, accents, pluriels)", async () => {
    await seed("Lampe cassée dans le couloir", { description: "L'éclairage ne fonctionne plus." });
    await seed("Wifi inaccessible", { category: "IT", description: "Aucun réseau en salle 12." });
    expect((await reports.search({ query: "lampe" }, page())).items.map((i) => i.report.title)).toEqual([
      "Lampe cassée dans le couloir",
    ]);
    expect((await reports.search({ query: "réseau" }, page())).total).toBe(1);
    expect((await reports.search({ query: "lampe", category: "IT" }, page())).total).toBe(0);
  });

  it("renvoie le nombre de soutiens de chaque signalement", async () => {
    const a = await seed("Lampe A"); const b = await seed("Lampe B");
    await supports.add({ reportId: a.id, userId: UserId.generate(), createdAt: new Date() });
    await supports.add({ reportId: a.id, userId: UserId.generate(), createdAt: new Date() });
    const counts = Object.fromEntries((await reports.search({}, page())).items.map((i) => [i.report.id, i.supportCount]));
    expect(counts).toEqual({ [a.id]: 2, [b.id]: 0 });
  });

  it("findSimilar : candidats ouverts de même catégorie ou au titre proche, jamais les résolus", async () => {
    const lamp = await seed("Lampe cassée couloir");
    await seed("Wifi inaccessible", { category: "IT" });
    const resolved = await seed("Lampe cassée parking");
    const w = resolved.assignTo(manager, new Date(t));
    const r1 = w.changeStatus(manager, "TAKEN", new Date(t));
    const r2 = r1.report.changeStatus(manager, "IN_PROGRESS", new Date(t));
    await reports.save(r2.report.changeStatus(manager, "RESOLVED", new Date(t), "Ampoule remplacée par l'équipe").report);

    const found = await reports.findSimilar({ title: "Lampe du couloir cassée", description: "", category: "LIGHTING", location: "B" }, 50);
    expect(found.map((f) => f.id)).toEqual([lamp.id]);
  });

  it("stats : totaux par statut/catégorie (zéros inclus) et délais de résolution", async () => {
    await seed("Lampe", { category: "LIGHTING" });
    const r = await seed("Wifi", { category: "IT" });
    const s1 = r.assignTo(manager, new Date(t)).changeStatus(manager, "TAKEN", new Date(t));
    const s2 = s1.report.changeStatus(manager, "IN_PROGRESS", new Date(t));
    const done = s2.report.changeStatus(manager, "RESOLVED", new Date(r.createdAt.getTime() + 3_600_000), "Câble remplacé par le service IT");
    await reports.save(done.report);

    const s = await reports.stats();
    expect(s.total).toBe(2);
    expect(s.byStatus).toEqual({ NEW: 1, TAKEN: 0, IN_PROGRESS: 0, RESOLVED: 1 });
    expect(s.byCategory).toMatchObject({ LIGHTING: 1, IT: 1, EQUIPMENT: 0, OTHER: 0 });
    expect(s.resolutionTimesMs).toEqual([3_600_000]);
  });
});
