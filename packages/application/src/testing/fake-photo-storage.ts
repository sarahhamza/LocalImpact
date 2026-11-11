import type { PhotoStorage, PhotoUpload } from "../ports";

export class FakePhotoStorage implements PhotoStorage {
  readonly uploads: PhotoUpload[] = [];
  async upload(photo: PhotoUpload): Promise<{ url: string }> {
    this.uploads.push(photo);
    return { url: `https://fake.cdn/${photo.filename}` };
  }
}
