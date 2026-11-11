import mongoose, { Schema, type Model } from "mongoose";

/** Document tel que stocké : _id = UUID (string), jamais d'ObjectId. */
export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
}

const schema = new Schema<UserDoc>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["USER", "MANAGER", "ADMIN"] },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const UserModel: Model<UserDoc> =
  (mongoose.models["User"] as Model<UserDoc> | undefined) ?? mongoose.model<UserDoc>("User", schema);
