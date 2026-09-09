import { Schema, model, type Document, type Types } from "mongoose";

/** Instructor partnership / course agreement (Academic or Super Admin uploads). */
export interface IInstructorAgreement extends Document {
  _id: Types.ObjectId;
  courseId?: Types.ObjectId;
  courseTitle: string;
  courseDescription?: string;
  description: string;
  fileUrl: string;
  fileName?: string;
  instructorId?: Types.ObjectId;
  isActive: boolean;
  status: "draft" | "active" | "archived";
  version: string;
  effectiveDate?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const instructorAgreementSchema = new Schema<IInstructorAgreement>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    courseTitle: { type: String, required: true, trim: true },
    courseDescription: { type: String, trim: true },
    description: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String },
    instructorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "active",
    },
    version: { type: String, default: "1.0" },
    effectiveDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const InstructorAgreement = model<IInstructorAgreement>(
  "InstructorAgreement",
  instructorAgreementSchema,
);
