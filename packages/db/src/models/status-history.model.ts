import mongoose, { Schema, type Model } from "mongoose";

export interface StatusHistoryDoc {
  _id: string;
  reportId: string;
  from: string;
  to: string;
  authorId: string;
  at: Date;
  note: string | null;
}

const schema = new Schema<StatusHistoryDoc>(
  {
    _id: { type: String, required: true },
    reportId: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    authorId: { type: String, required: true },
    at: { type: Date, required: true },
    note: { type: String, default: null },
  },
  { versionKey: false },
);

export const StatusHistoryModel: Model<StatusHistoryDoc> =
  (mongoose.models["StatusHistory"] as Model<StatusHistoryDoc> | undefined) ??
  mongoose.model<StatusHistoryDoc>("StatusHistory", schema);
