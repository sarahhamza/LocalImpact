import mongoose, { Schema, type Model } from "mongoose";

export interface SupportDoc {
  /** `${reportId}:${userId}` : l'unicité est garantie même sans l'index (et l'index la double). */
  _id: string;
  reportId: string;
  userId: string;
  createdAt: Date;
}

const schema = new Schema<SupportDoc>(
  {
    _id: { type: String, required: true },
    reportId: { type: String, required: true },
    userId: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const SupportModel: Model<SupportDoc> =
  (mongoose.models["Support"] as Model<SupportDoc> | undefined) ?? mongoose.model<SupportDoc>("Support", schema);
