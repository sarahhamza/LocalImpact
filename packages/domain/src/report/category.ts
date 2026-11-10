export const CATEGORIES = [
  "EQUIPMENT", // matériel défectueux
  "ACCESSIBILITY",
  "LIGHTING",
  "CLEANLINESS",
  "IT", // équipement informatique
  "OTHER",
] as const;
export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}
