export interface PhotoUpload {
  data: Uint8Array;
  contentType: string;
  filename: string;
}

export interface PhotoStorage {
  /** Enregistre la photo et renvoie son URL publique (https). */
  upload(photo: PhotoUpload): Promise<{ url: string }>;
}
