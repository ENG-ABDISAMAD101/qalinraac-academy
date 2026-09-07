import { Schema, model, type Document, type Types } from "mongoose";

export type SubmissionStatus = "submitted" | "graded" | "returned";

export interface ISubmission extends Document {
  _id: Types.ObjectId;
  assignmentId: Types.ObjectId;
  userId: Types.ObjectId;
  content?: string;
  fileAssetId?: Types.ObjectId;
  status: SubmissionStatus;
  score?: number;
  feedback?: string;
  gradedBy?: Types.ObjectId;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String },
    fileAssetId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
    status: {
      type: String,
      enum: ["submitted", "graded", "returned"],
      default: "submitted",
    },
    score: { type: Number },
    feedback: { type: String },
    gradedBy: { type: Schema.Types.ObjectId, ref: "User" },
    gradedAt: { type: Date },
  },
  { timestamps: true },
);

submissionSchema.index({ assignmentId: 1, userId: 1 }, { unique: true });

export const Submission = model<ISubmission>("Submission", submissionSchema);
