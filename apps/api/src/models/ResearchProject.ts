import { Schema, model, type Document, type Types } from "mongoose";

export type ResearchStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected";

export interface IResearchProject extends Document {
  _id: Types.ObjectId;
  title: string;
  abstract?: string;
  authorId: Types.ObjectId;
  status: ResearchStatus;
  fileAssetId?: Types.ObjectId;
  reviewNotes?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const researchProjectSchema = new Schema<IResearchProject>(
  {
    title: { type: String, required: true, trim: true },
    abstract: { type: String },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["draft", "submitted", "under_review", "approved", "rejected"],
      default: "draft",
    },
    fileAssetId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
    reviewNotes: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

export const ResearchProject = model<IResearchProject>(
  "ResearchProject",
  researchProjectSchema,
);
