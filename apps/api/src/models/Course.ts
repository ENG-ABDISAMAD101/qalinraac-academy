import {
  courseLevelSchema,
  courseReviewStatusSchema,
  courseStatusSchema,
  type CourseLevel,
  type CourseReviewStatus,
  type CourseStatus,
} from "@qalinraac/shared";
import { Schema, model, type Document, type Types } from "mongoose";

export type CourseVisibility = "public" | "private" | "unlisted";

export interface ICourse extends Document {
  _id: Types.ObjectId;
  title: string;
  subtitle?: string;
  slug: string;
  description: string;
  shortDescription?: string;
  status: CourseStatus;
  reviewStatus: CourseReviewStatus;
  isDisabled: boolean;
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
  /** Last completed builder step (1–10). */
  builderStep: number;
  createdBy: Types.ObjectId;
  /** When set, this row is an unpublished revision of a live published course. */
  liveCourseId?: Types.ObjectId;
  rejectionReason?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
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
      // Include legacy values so existing docs load until migrateCourseStatuses runs.
      enum: [
        ...courseStatusSchema.options,
        "pending_review",
        "academic_approved",
        "rejected",
      ],
      default: "draft",
    },
    reviewStatus: {
      type: String,
      enum: courseReviewStatusSchema.options,
      default: "none",
    },
    isDisabled: { type: Boolean, default: false },
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
    builderStep: { type: Number, default: 1, min: 1, max: 10 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    liveCourseId: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    rejectionReason: { type: String },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

courseSchema.index({ status: 1, reviewStatus: 1 });
courseSchema.index({ isDisabled: 1, status: 1 });

export const Course = model<ICourse>("Course", courseSchema);
