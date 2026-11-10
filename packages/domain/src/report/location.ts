import { ValidationError } from "../shared/domain-error";

/** Lieu libre (« Bâtiment B – 2e étage »). */
export type Location = string & { readonly __brand: "Location" };

export const Location = {
  of(value: string): Location {
    const v = (value ?? "").trim().replace(/\s+/g, " ");
    if (v.length < 2 || v.length > 120) {
      throw new ValidationError("location", "Le lieu doit contenir entre 2 et 120 caractères");
    }
    return v as Location;
  },
};
