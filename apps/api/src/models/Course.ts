import { courseStatusSchema } from "@qalinraac/shared";
import { Schema, model, type Document, type Types } from "mongoose";

export type CourseStatus = "draft" | "published" | "archived";

export interface ICourse extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  status: CourseStatus;
  instructorIds: Types.ObjectId[];
  priceCents: number;
  currency: string;
  thumbnailUrl?: string;
  createdBy: Types.ObjectId;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: courseStatusSchema.options,
      default: "draft",
    },
    instructorIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    priceCents: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "USD" },
    thumbnailUrl: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

export const Course = model<ICourse>("Course", courseSchema);
