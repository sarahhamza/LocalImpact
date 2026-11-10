import type { Category } from "./category";
import type { ReportId } from "./report-id";
import type { ReportStatus } from "./report-status";

/** Le minimum nécessaire pour comparer : un Report ou une saisie en cours de formulaire. */
export interface SimilarityTarget {
  title: string;
  description: string;
  category: Category | string;
  location: string;
}

export interface ExistingReport extends SimilarityTarget {
  id: ReportId;
  status: ReportStatus;
}

export interface SimilarReport {
  reportId: ReportId;
  /** Score de similarité entre 0 et 1 (arrondi à 2 décimales). */
  score: number;
  reasons: string[];
}

export interface DetectorOptions {
  /** Score minimal pour être suggéré (défaut 0.3). */
  threshold?: number;
  /** Nombre maximal de suggestions (défaut 5). */
  limit?: number;
  /** Inclure les signalements déjà résolus (défaut false). */
  includeResolved?: boolean;
}

const STOP_WORDS = new Set([
  "le", "la", "les", "un", "une", "des", "du", "de", "d", "l", "et", "ou", "a", "au", "aux", "en",
  "dans", "sur", "sous", "est", "sont", "il", "elle", "ce", "cet", "cette", "ces", "qui", "que",
  "pas", "ne", "y", "pour", "par", "avec", "plus", "tres", "depuis", "mais", "se", "sa", "son",
  "ses", "ca", "the", "and", "is", "in", "of", "to",
]);

/** minuscules, sans accents ni ponctuation. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ensemble de mots significatifs, avec un « stemming » minimal (pluriels). */
export function tokenize(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of normalize(text).split(" ")) {
    if (raw.length < 2 || STOP_WORDS.has(raw)) continue;
    out.add(raw.length > 4 && (raw.endsWith("s") || raw.endsWith("x")) ? raw.slice(0, -1) : raw);
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

function sameLocation(a: string, b: string): boolean {
  const x = normalize(a);
  const y = normalize(b);
  return x.length > 0 && y.length > 0 && (x === y || x.includes(y) || y.includes(x));
}

/**
 * Score = 75 % de similarité textuelle (titre 60 % + titre/description 40 %)
 *       + 10 % si même catégorie + 15 % si même lieu.
 * Les bonus ne comptent que si les textes partagent déjà un minimum de mots :
 * deux signalements dans le même lieu mais sans rapport ne sont PAS des doublons.
 */
export function similarityScore(a: SimilarityTarget, b: SimilarityTarget): { score: number; reasons: string[] } {
  const titleSim = jaccard(tokenize(a.title), tokenize(b.title));
  const fullSim = jaccard(tokenize(`${a.title} ${a.description}`), tokenize(`${b.title} ${b.description}`));
  const text = 0.6 * titleSim + 0.4 * fullSim;

  const reasons: string[] = [];
  if (text < 0.1) return { score: round(text * 0.75), reasons };

  let score = text * 0.75;
  reasons.push(`texte similaire (${Math.round(text * 100)} %)`);
  if (a.category === b.category) {
    score += 0.1;
    reasons.push("même catégorie");
  }
  if (sameLocation(a.location, b.location)) {
    score += 0.15;
    reasons.push("même lieu");
  }
  return { score: round(Math.min(1, score)), reasons };
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Suggestions de doublons pour un signalement en cours de saisie. */
export function findSimilar(
  candidate: SimilarityTarget,
  existing: readonly ExistingReport[],
  options: DetectorOptions = {},
): SimilarReport[] {
  const { threshold = 0.3, limit = 5, includeResolved = false } = options;
  return existing
    .filter((r) => includeResolved || r.status !== "RESOLVED")
    .map((r) => ({ reportId: r.id, ...similarityScore(candidate, r) }))
    .filter((r) => r.score >= threshold)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}
