import { Schema, model, type Document, type Types } from "mongoose";

export type EnrollmentStatus = "pending_payment" | "active" | "completed" | "cancelled";

export interface IEnrollment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: EnrollmentStatus;
  progressPercent: number;
  enrolledAt: Date;
  completedAt?: Date;
  unlockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    status: {
      type: String,
      enum: ["pending_payment", "active", "completed", "cancelled"],
      default: "active",
    },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    unlockedAt: { type: Date },
  },
  { timestamps: true },
);

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Enrollment = model<IEnrollment>("Enrollment", enrollmentSchema);
