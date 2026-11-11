import { Report, ValidationError } from "@acme/domain";
import type { Clock, PhotoStorage, PhotoUpload, ReportRepository, UserRepository } from "../ports";
import type { Actor } from "../shared/actor";
import { guard, type Result } from "../shared/result";
import { toReportDto, type ReportDto } from "./report-dto";

export interface CreateReportInput {
  title: string;
  description: string;
  category: string;
  location: string;
  photo?: PhotoUpload | null;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class CreateReport {
  constructor(
    private readonly deps: {
      reports: ReportRepository;
      users: UserRepository;
      photos: PhotoStorage;
      clock: Clock;
    },
  ) {}

  execute(actor: Actor, input: CreateReportInput): Promise<Result<ReportDto>> {
    return guard(async () => {
      const { reports, users, photos, clock } = this.deps;

      // 1. Valider le signalement AVANT d'uploader quoi que ce soit
      const draft = Report.create({ ...input, photoUrl: null, authorId: actor.id, now: clock.now() });

      // 2. Photo facultative
      let photoUrl: string | null = null;
      if (input.photo && input.photo.data.byteLength > 0) {
        if (!PHOTO_TYPES.includes(input.photo.contentType)) {
          throw new ValidationError("photo", "Format de photo non supporté (JPEG, PNG ou WebP)");
        }
        if (input.photo.data.byteLength > MAX_PHOTO_BYTES) {
          throw new ValidationError("photo", "La photo dépasse 5 Mo");
        }
        photoUrl = (await photos.upload(input.photo)).url;
      }

      const report = photoUrl ? Report.restore({ ...draft.toProps(), photoUrl }) : draft;
      await reports.save(report);

      const names = await users.namesByIds([actor.id]);
      return toReportDto(report, { supportCount: 0, names });
    });
  }
}
