/** Erreur métier : porte un code stable (traduit en message côté web) et un message technique. */
export class DomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

/** Champ invalide (titre trop court, e-mail mal formé...). */
export class ValidationError extends DomainError {
  readonly field: string;

  constructor(field: string, message: string) {
    super("VALIDATION", message);
    this.field = field;
  }
}
