import { v2 as cloudinary } from "cloudinary";
import { ValidationError } from "@acme/domain";
import type { PhotoStorage, PhotoUpload } from "@acme/application";

/** Photo facultative hébergée sur Cloudinary (`CLOUDINARY_URL=cloudinary://key:secret@cloud`). */
export class CloudinaryPhotoStorage implements PhotoStorage {
  constructor(cloudinaryUrl: string) {
    process.env["CLOUDINARY_URL"] = cloudinaryUrl;
    cloudinary.config({ secure: true });
  }

  upload(photo: PhotoUpload): Promise<{ url: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "localimpact", resource_type: "image" }, (err, res) => {
        if (err || !res) return reject(err ?? new Error("Échec de l'upload Cloudinary"));
        resolve({ url: res.secure_url });
      });
      stream.end(Buffer.from(photo.data));
    });
  }
}

/** Repli quand CLOUDINARY_URL n'est pas défini : l'app fonctionne, sans photos. */
export class DisabledPhotoStorage implements PhotoStorage {
  async upload(_photo: PhotoUpload): Promise<{ url: string }> {
    throw new ValidationError("photo", "L'envoi de photos n'est pas configuré sur ce serveur");
  }
}
