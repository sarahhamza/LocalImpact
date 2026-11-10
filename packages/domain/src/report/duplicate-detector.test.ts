import { describe, expect, it } from "vitest";
import { findSimilar, normalize, tokenize, type ExistingReport } from "./duplicate-detector";
import { ReportId } from "./report-id";

const mk = (over: Partial<ExistingReport> & { title: string }): ExistingReport => ({
  id: ReportId.generate(),
  description: "",
  category: "LIGHTING",
  location: "Bâtiment B",
  status: "NEW",
  ...over,
});

describe("normalize / tokenize", () => {
  it("ignore casse, accents, ponctuation et mots vides", () => {
    expect(normalize("Lampe CASSÉE !")).toBe("lampe cassee");
    expect([...tokenize("La lampe est cassée dans le couloir")]).toEqual(["lampe", "cassee", "couloir"]);
  });
  it("rapproche singulier et pluriel", () => {
    expect(tokenize("lampes")).toEqual(tokenize("lampe"));
  });
});

describe("findSimilar", () => {
  const candidate = {
    title: "Lampe cassée dans le couloir",
    description: "La lampe du couloir du bâtiment B est cassée",
    category: "LIGHTING",
    location: "Bâtiment B",
  };

  it("détecte un doublon probable et l'explique", () => {
    const dup = mk({ title: "Lampe du couloir cassée", description: "Couloir bâtiment B, lampe cassée depuis lundi" });
    const [hit] = findSimilar(candidate, [dup]);
    expect(hit?.reportId).toBe(dup.id);
    expect(hit!.score).toBeGreaterThan(0.5);
    expect(hit!.reasons).toContain("même catégorie");
    expect(hit!.reasons).toContain("même lieu");
  });

  it("ignore un signalement sans rapport, même dans le même lieu", () => {
    const other = mk({ title: "Wifi inaccessible", description: "Pas de réseau en salle 12", category: "IT" });
    expect(findSimilar(candidate, [other])).toEqual([]);
  });

  it("trie par score décroissant et respecte la limite", () => {
    const close = mk({ title: "Lampe cassée dans le couloir", description: "Lampe du couloir bâtiment B" });
    const mid = mk({ title: "Lampe couloir clignote", description: "Éclairage instable" });
    const res = findSimilar(candidate, [mid, close], { limit: 1, threshold: 0.1 });
    expect(res).toHaveLength(1);
    expect(res[0]?.reportId).toBe(close.id);
  });

  it("exclut les signalements résolus sauf demande explicite", () => {
    const resolved = mk({ title: "Lampe cassée dans le couloir", description: "Lampe du couloir", status: "RESOLVED" });
    expect(findSimilar(candidate, [resolved])).toEqual([]);
    expect(findSimilar(candidate, [resolved], { includeResolved: true })).toHaveLength(1);
  });

  it("donne un score entre 0 et 1", () => {
    const same = mk({ ...candidate, category: "LIGHTING" });
    const [hit] = findSimilar(candidate, [same]);
    expect(hit!.score).toBeLessThanOrEqual(1);
    expect(hit!.score).toBeGreaterThan(0.9);
  });
});
