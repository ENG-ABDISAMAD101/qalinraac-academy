import { Schema, model, type Document, type Types } from "mongoose";

/**
 * Academic submits activation for an existing student.
 * Super Admin gives final approval → enrollment unlocked / active.
 */
export type ActivationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "completed";

export interface IStudentActivation extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  priceCents: number;
  currency: string;
  status: ActivationStatus;
  requestedBy: Types.ObjectId;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  enrollmentId?: Types.ObjectId;
  activatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studentActivationSchema = new Schema<IStudentActivation>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    priceCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", uppercase: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "active", "completed"],
      default: "pending",
      index: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: "Enrollment" },
    activatedAt: { type: Date },
  },
  { timestamps: true },
);

studentActivationSchema.index({ studentId: 1, courseId: 1, status: 1 });

export const StudentActivation = model<IStudentActivation>(
  "StudentActivation",
  studentActivationSchema,
);
