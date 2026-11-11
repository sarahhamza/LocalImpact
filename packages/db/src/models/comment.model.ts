import mongoose, { Schema, type Model } from "mongoose";

export interface CommentDoc {
  _id: string;
  reportId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

const schema = new Schema<CommentDoc>(
  {
    _id: { type: String, required: true },
    reportId: { type: String, required: true },
    authorId: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const CommentModel: Model<CommentDoc> =
  (mongoose.models["Comment"] as Model<CommentDoc> | undefined) ?? mongoose.model<CommentDoc>("Comment", schema);
