import mongoose, { Schema, type Model } from "mongoose";

export interface ReportDoc {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  photoUrl: string | null;
  authorId: string;
  assignedToId: string | null;
  status: string;
  resolutionDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

const schema = new Schema<ReportDoc>(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    photoUrl: { type: String, default: null },
    authorId: { type: String, required: true },
    assignedToId: { type: String, default: null },
    status: { type: String, required: true, enum: ["NEW", "TAKEN", "IN_PROGRESS", "RESOLVED"] },
    resolutionDescription: { type: String, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    resolvedAt: { type: Date, default: null },
  },
  { versionKey: false },
);

export const ReportModel: Model<ReportDoc> =
  (mongoose.models["Report"] as Model<ReportDoc> | undefined) ?? mongoose.model<ReportDoc>("Report", schema);
