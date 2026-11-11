/** Erreur applicative (≠ erreur du domaine) : droits, ressource absente, identifiants. */
export class AppError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class NonAutorise extends AppError {
  constructor(message = "Vous n'avez pas les droits pour cette action") {
    super("NON_AUTORISE", message);
  }
}

export class Introuvable extends AppError {
  constructor(entity: string) {
    super("INTROUVABLE", `${entity} introuvable`);
  }
}

export class IdentifiantsInvalides extends AppError {
  constructor() {
    super("IDENTIFIANTS_INVALIDES", "E-mail ou mot de passe incorrect");
  }
}

export class EmailDejaUtilise extends AppError {
  constructor() {
    super("EMAIL_DEJA_UTILISE", "Cette adresse e-mail est déjà utilisée");
  }
}
