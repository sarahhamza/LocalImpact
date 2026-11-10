import { describe, expect, it } from "vitest";
import { Report } from "./report";
import { UserId } from "../user/user-id";
import { ResolutionSansDescription, TransitionInvalide, ChangementStatutNonAutorise, AssignationInvalide } from "./errors";
import { ValidationError } from "../shared/domain-error";
import type { ActorRef } from "../user/actor-ref";

const t0 = new Date("2026-01-01T10:00:00Z");
const t1 = new Date("2026-01-01T12:00:00Z");
const t2 = new Date("2026-01-02T10:00:00Z");

const author = UserId.generate();
const manager: ActorRef = { id: UserId.generate(), role: "MANAGER" };
const otherManager: ActorRef = { id: UserId.generate(), role: "MANAGER" };
const admin: ActorRef = { id: UserId.generate(), role: "ADMIN" };
const user: ActorRef = { id: author, role: "USER" };

const newReport = () =>
  Report.create({
    title: "Lampe cassée couloir B",
    description: "La lampe du couloir du bâtiment B ne fonctionne plus.",
    category: "LIGHTING",
    location: "Bâtiment B",
    authorId: author,
    now: t0,
  });

const inProgress = () => {
  let r = newReport().assignTo(manager, t0);
  r = r.changeStatus(manager, "TAKEN", t0).report;
  return r.changeStatus(manager, "IN_PROGRESS", t0).report;
};

describe("Report.create", () => {
  it("crée un signalement NEW non assigné", () => {
    const r = newReport();
    expect(r.status).toBe("NEW");
    expect(r.assignedToId).toBeNull();
    expect(r.photoUrl).toBeNull();
    expect(r.createdAt).toEqual(t0);
  });

  it("rejette titre, description, catégorie et photo invalides", () => {
    const base = { title: "Titre ok", description: "Description assez longue", category: "OTHER", location: "Hall", authorId: author, now: t0 };
    expect(() => Report.create({ ...base, title: "ab" })).toThrow(ValidationError);
    expect(() => Report.create({ ...base, description: "court" })).toThrow(ValidationError);
    expect(() => Report.create({ ...base, category: "NOPE" })).toThrow(ValidationError);
    expect(() => Report.create({ ...base, photoUrl: "ftp://x" })).toThrow(ValidationError);
    expect(() => Report.create({ ...base, location: " " })).toThrow(ValidationError);
  });
});

describe("assignTo", () => {
  it("assigne un responsable ou un admin", () => {
    expect(newReport().assignTo(manager, t1).assignedToId).toBe(manager.id);
    expect(newReport().assignTo(admin, t1).assignedToId).toBe(admin.id);
  });
  it("refuse d'assigner un simple utilisateur", () => {
    expect(() => newReport().assignTo(user, t1)).toThrow(AssignationInvalide);
  });
  it("refuse d'assigner un signalement résolu", () => {
    const resolved = inProgress().resolve(manager, "Ampoule remplacée par l'équipe technique", t2).report;
    expect(() => resolved.assignTo(otherManager, t2)).toThrow(AssignationInvalide);
  });
});

describe("changeStatus : droits", () => {
  it("autorise le responsable assigné et l'admin", () => {
    const r = newReport().assignTo(manager, t0);
    expect(r.changeStatus(manager, "TAKEN", t1).report.status).toBe("TAKEN");
    expect(r.changeStatus(admin, "TAKEN", t1).report.status).toBe("TAKEN");
  });
  it("refuse un autre responsable, un utilisateur, et un responsable sans assignation", () => {
    const assigned = newReport().assignTo(manager, t0);
    expect(() => assigned.changeStatus(otherManager, "TAKEN", t1)).toThrow(ChangementStatutNonAutorise);
    expect(() => assigned.changeStatus(user, "TAKEN", t1)).toThrow(ChangementStatutNonAutorise);
    expect(() => newReport().changeStatus(manager, "TAKEN", t1)).toThrow(ChangementStatutNonAutorise);
  });
});

describe("changeStatus : transitions et historique", () => {
  it("suit NEW → TAKEN → IN_PROGRESS → RESOLVED et produit une ligne d'historique à chaque fois", () => {
    let r = newReport().assignTo(manager, t0);
    const steps = ["TAKEN", "IN_PROGRESS"] as const;
    for (const to of steps) {
      const { report, change } = r.changeStatus(manager, to, t1);
      expect(change).toMatchObject({ from: r.status, to, authorId: manager.id, at: t1, reportId: r.id });
      r = report;
    }
    const { report, change } = r.resolve(manager, "Ampoule remplacée par l'équipe technique", t2);
    expect(change).toMatchObject({ from: "IN_PROGRESS", to: "RESOLVED", note: "Ampoule remplacée par l'équipe technique" });
    expect(report.status).toBe("RESOLVED");
    expect(report.resolvedAt).toEqual(t2);
  });

  it("refuse de sauter une étape ou de revenir en arrière", () => {
    const r = newReport().assignTo(manager, t0);
    expect(() => r.changeStatus(manager, "IN_PROGRESS", t1)).toThrow(TransitionInvalide);
    expect(() => r.changeStatus(manager, "RESOLVED", t1, "Description suffisante")).toThrow(TransitionInvalide);
    expect(() => inProgress().changeStatus(manager, "NEW", t1)).toThrow(TransitionInvalide);
  });

  it("ne modifie pas l'instance d'origine (immutabilité)", () => {
    const r = newReport().assignTo(manager, t0);
    r.changeStatus(manager, "TAKEN", t1);
    expect(r.status).toBe("NEW");
  });
});

describe("résolution", () => {
  it("exige une description d'intervention", () => {
    expect(() => inProgress().resolve(manager, "", t2)).toThrow(ResolutionSansDescription);
    expect(() => inProgress().resolve(manager, "   ", t2)).toThrow(ResolutionSansDescription);
    expect(() => inProgress().resolve(manager, "ok", t2)).toThrow(ResolutionSansDescription);
    expect(() => inProgress().changeStatus(manager, "RESOLVED", t2)).toThrow(ResolutionSansDescription);
  });

  it("calcule le délai de résolution", () => {
    expect(inProgress().resolutionTimeMs()).toBeNull();
    const resolved = inProgress().resolve(manager, "Ampoule remplacée par l'équipe technique", t2).report;
    expect(resolved.resolutionTimeMs()).toBe(t2.getTime() - t0.getTime());
    expect(resolved.resolutionDescription).toBe("Ampoule remplacée par l'équipe technique");
  });
});
