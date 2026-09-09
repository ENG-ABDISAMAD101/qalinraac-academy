import {
  courseLevelSchema,
  courseStatusSchema,
  type CourseLevel,
} from "@qalinraac/shared";
import { Schema, model, type Document, type Types } from "mongoose";

export type CourseStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "archived";

export type CourseVisibility = "public" | "private" | "unlisted";

export interface ICourse extends Document {
  _id: Types.ObjectId;
  title: string;
  subtitle?: string;
  slug: string;
  description: string;
  shortDescription?: string;
  status: CourseStatus;
  level: CourseLevel;
  category?: string;
  language?: string;
  learningOutcomes: string[];
  requirements: string[];
  targetAudience: string[];
  tags: string[];
  instructorIds: Types.ObjectId[];
  isFree: boolean;
  priceCents: number;
  discountPriceCents?: number;
  accessDuration: "6_months" | "1_year" | "lifetime";
  currency: string;
  visibility: CourseVisibility;
  thumbnailUrl?: string;
  bannerUrl?: string;
  promoVideoUrl?: string;
  /** Last completed builder step (1–7). */
  builderStep: number;
  createdBy: Types.ObjectId;
  rejectionReason?: string;
  submittedAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    shortDescription: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: courseStatusSchema.options,
      default: "draft",
    },
    level: {
      type: String,
      enum: courseLevelSchema.options,
      default: "beginner",
    },
    category: { type: String, trim: true },
    language: { type: String, trim: true, default: "en" },
    learningOutcomes: [{ type: String, trim: true }],
    requirements: [{ type: String, trim: true }],
    targetAudience: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    instructorIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isFree: { type: Boolean, default: true },
    priceCents: { type: Number, default: 0, min: 0 },
    discountPriceCents: { type: Number, min: 0 },
    accessDuration: {
      type: String,
      enum: ["6_months", "1_year", "lifetime"],
      default: "lifetime",
    },
    currency: { type: String, default: "USD" },
    visibility: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "public",
    },
    thumbnailUrl: { type: String },
    bannerUrl: { type: String },
    promoVideoUrl: { type: String },
    builderStep: { type: Number, default: 1, min: 1, max: 9 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rejectionReason: { type: String },
    submittedAt: { type: Date },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

export const Course = model<ICourse>("Course", courseSchema);
