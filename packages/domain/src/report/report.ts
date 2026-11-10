import { ValidationError } from "../shared/domain-error";
import { StatusChange } from "../status-change/status-change";
import type { ActorRef } from "../user/actor-ref";
import { canBeAssigned } from "../user/role";
import type { UserId } from "../user/user-id";
import { isCategory, type Category } from "./category";
import {
  AssignationInvalide,
  ChangementStatutNonAutorise,
  ResolutionSansDescription,
  TransitionInvalide,
} from "./errors";
import { Location } from "./location";
import { ReportId } from "./report-id";
import { canTransition, type ReportStatus } from "./report-status";

export const MIN_RESOLUTION_LENGTH = 10;

export interface ReportProps {
  id: ReportId;
  title: string;
  description: string;
  category: Category;
  location: Location;
  photoUrl: string | null;
  authorId: UserId;
  assignedToId: UserId | null;
  status: ReportStatus;
  resolutionDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

export interface CreateReportInput {
  id?: ReportId;
  title: string;
  description: string;
  category: string;
  location: string;
  photoUrl?: string | null;
  authorId: UserId;
  now: Date;
}

/** Résultat d'une opération qui modifie le statut : nouvel état + ligne d'historique. */
export interface Transition {
  report: Report;
  change: StatusChange;
}

export class Report {
  private constructor(private readonly props: ReportProps) {}

  static create(input: CreateReportInput): Report {
    const title = (input.title ?? "").trim();
    if (title.length < 3 || title.length > 120) {
      throw new ValidationError("title", "Le titre doit contenir entre 3 et 120 caractères");
    }
    const description = (input.description ?? "").trim();
    if (description.length < 10 || description.length > 2000) {
      throw new ValidationError("description", "La description doit contenir entre 10 et 2000 caractères");
    }
    if (!isCategory(input.category)) {
      throw new ValidationError("category", "Catégorie inconnue");
    }
    const photoUrl = input.photoUrl?.trim() || null;
    if (photoUrl && !/^https?:\/\//i.test(photoUrl)) {
      throw new ValidationError("photoUrl", "L'URL de la photo est invalide");
    }
    return new Report({
      id: input.id ?? ReportId.generate(),
      title,
      description,
      category: input.category,
      location: Location.of(input.location),
      photoUrl,
      authorId: input.authorId,
      assignedToId: null,
      status: "NEW",
      resolutionDescription: null,
      createdAt: input.now,
      updatedAt: input.now,
      resolvedAt: null,
    });
  }

  static restore(props: ReportProps): Report {
    return new Report({ ...props });
  }

  /** Attribue le signalement à un responsable (ou administrateur). Impossible une fois résolu. */
  assignTo(assignee: ActorRef, now: Date): Report {
    if (!canBeAssigned(assignee.role)) {
      throw new AssignationInvalide("Seul un responsable ou un administrateur peut être assigné");
    }
    if (this.props.status === "RESOLVED") {
      throw new AssignationInvalide("Un signalement résolu ne peut plus être assigné");
    }
    return new Report({ ...this.props, assignedToId: assignee.id, updatedAt: now });
  }

  /** Droit de changer le statut : administrateur, ou responsable assigné à CE signalement. */
  canChangeStatus(actor: ActorRef): boolean {
    if (actor.role === "ADMIN") return true;
    return actor.role === "MANAGER" && this.props.assignedToId === actor.id;
  }

  changeStatus(actor: ActorRef, to: ReportStatus, now: Date, interventionDescription?: string): Transition {
    if (!this.canChangeStatus(actor)) throw new ChangementStatutNonAutorise();

    const from = this.props.status;
    if (!canTransition(from, to)) throw new TransitionInvalide(from, to);

    const note = interventionDescription?.trim() || null;
    if (to === "RESOLVED" && (note === null || note.length < MIN_RESOLUTION_LENGTH)) {
      throw new ResolutionSansDescription();
    }

    const report = new Report({
      ...this.props,
      status: to,
      updatedAt: now,
      resolvedAt: to === "RESOLVED" ? now : this.props.resolvedAt,
      resolutionDescription: to === "RESOLVED" ? note : this.props.resolutionDescription,
    });
    const change = StatusChange.create({
      reportId: this.props.id,
      from,
      to,
      authorId: actor.id,
      at: now,
      note: to === "RESOLVED" ? note : null,
    });
    return { report, change };
  }

  /** Raccourci métier : passe de IN_PROGRESS à RESOLVED avec la description d'intervention. */
  resolve(actor: ActorRef, interventionDescription: string, now: Date): Transition {
    return this.changeStatus(actor, "RESOLVED", now, interventionDescription);
  }

  /** Délai de résolution en millisecondes (null tant que non résolu). */
  resolutionTimeMs(): number | null {
    return this.props.resolvedAt ? this.props.resolvedAt.getTime() - this.props.createdAt.getTime() : null;
  }

  get id() { return this.props.id; }
  get title() { return this.props.title; }
  get description() { return this.props.description; }
  get category() { return this.props.category; }
  get location() { return this.props.location; }
  get photoUrl() { return this.props.photoUrl; }
  get authorId() { return this.props.authorId; }
  get assignedToId() { return this.props.assignedToId; }
  get status() { return this.props.status; }
  get resolutionDescription() { return this.props.resolutionDescription; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
  get resolvedAt() { return this.props.resolvedAt; }

  toProps(): ReportProps {
    return { ...this.props };
  }
}
