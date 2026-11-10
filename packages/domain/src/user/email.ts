import { ValidationError } from "../shared/domain-error";

export type Email = string & { readonly __brand: "Email" };

const PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const Email = {
  of(value: string): Email {
    const v = (value ?? "").trim().toLowerCase();
    if (v.length > 254 || !PATTERN.test(v)) {
      throw new ValidationError("email", "Adresse e-mail invalide");
    }
    return v as Email;
  },
};
