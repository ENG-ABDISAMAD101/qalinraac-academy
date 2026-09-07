import { certificateStatusSchema } from "@qalinraac/shared";
import { Schema, model, type Document, type Types } from "mongoose";

export type CertificateStatus = "pending" | "approved" | "rejected" | "issued";

export interface ICertificateRequest extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  status: CertificateStatus;
  filePath?: string;
  fileUrl?: string;
  issuedAt?: Date;
  issuedBy?: Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const certificateRequestSchema = new Schema<ICertificateRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true },
    status: {
      type: String,
      enum: certificateStatusSchema.options,
      default: "pending",
    },
    filePath: { type: String },
    fileUrl: { type: String },
    issuedAt: { type: Date },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
  },
  { timestamps: true },
);

certificateRequestSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const CertificateRequest = model<ICertificateRequest>(
  "CertificateRequest",
  certificateRequestSchema,
);
