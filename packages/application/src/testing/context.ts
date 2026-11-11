import {
  REPORT_STATUSES,
  Report,
  User,
  UserId,
  type Category,
  type ReportStatus,
  type Role,
} from "@acme/domain";
import type { Actor } from "../shared/actor";
import { FakeClock } from "./fake-clock";
import { FakeCommentRepository } from "./fake-comment-repository";
import { FakePasswordHasher } from "./fake-password-hasher";
import { FakePhotoStorage } from "./fake-photo-storage";
import { FakeReportRepository } from "./fake-report-repository";
import { FakeStatusHistoryRepository } from "./fake-status-history-repository";
import { FakeSupportRepository } from "./fake-support-repository";
import { FakeUserRepository } from "./fake-user-repository";

export interface SeedReportOptions {
  title?: string;
  description?: string;
  category?: Category;
  location?: string;
  /** Responsable assigné (et qui fait avancer le statut). */
  assignTo?: Actor;
  /** Statut final voulu : les transitions intermédiaires sont jouées et historisées. */
  status?: ReportStatus;
  /** Délai écoulé avant le passage à RESOLVED (pour tester les délais de résolution). */
  resolveAfterMs?: number;
}

/** Tous les fakes + des raccourcis de données : un « monde » neuf pour chaque test. */
export function createTestContext() {
  const clock = new FakeClock();
  const users = new FakeUserRepository();
  const supports = new FakeSupportRepository();
  const reports = new FakeReportRepository(supports);
  const history = new FakeStatusHistoryRepository();
  const comments = new FakeCommentRepository();
  const hasher = new FakePasswordHasher();
  const photos = new FakePhotoStorage();
  let counter = 0;

  async function createUser(role: Role = "USER", name?: string): Promise<Actor & { name: string; email: string }> {
    counter++;
    const label = name ?? `${role.toLowerCase()}${counter}`;
    const email = `${label.toLowerCase().replace(/\s+/g, ".")}@test.tn`;
    const base = User.register({ name: label, email, passwordHash: await hasher.hash("password123"), now: clock.now() });
    const user = base.changeRole(role);
    await users.save(user);
    return { id: user.id, role, name: label, email };
  }

  async function createReport(author: Actor, o: SeedReportOptions = {}): Promise<Report> {
    let report = Report.create({
      title: o.title ?? "Lampe cassée couloir B",
      description: o.description ?? "La lampe du couloir ne fonctionne plus depuis lundi.",
      category: o.category ?? "LIGHTING",
      location: o.location ?? "Bâtiment B",
      authorId: author.id,
      now: clock.now(),
    });
    if (o.assignTo) report = report.assignTo(o.assignTo, clock.now());

    const worker: Actor = o.assignTo ?? { id: UserId.generate(), role: "ADMIN" };
    const steps = REPORT_STATUSES.slice(1, REPORT_STATUSES.indexOf(o.status ?? "NEW") + 1);
    for (const status of steps) {
      if (status === "RESOLVED" && o.resolveAfterMs) clock.advance(o.resolveAfterMs);
      const t = report.changeStatus(worker, status, clock.now(), status === "RESOLVED" ? "Intervention effectuée par l'équipe" : undefined);
      report = t.report;
      await history.add(t.change);
    }
    await reports.save(report);
    return report;
  }

  return { clock, users, supports, reports, history, comments, hasher, photos, createUser, createReport };
}

export type TestContext = ReturnType<typeof createTestContext>;
