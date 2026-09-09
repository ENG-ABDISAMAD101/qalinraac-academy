import { Schema, model, type Document, type Types } from "mongoose";

export interface ICourseResource extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId?: Types.ObjectId;
  lessonId?: Types.ObjectId;
  title: string;
  description?: string;
  fileAssetId: Types.ObjectId;
  mimeType: string;
  originalName: string;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const courseResourceSchema = new Schema<ICourseResource>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    moduleId: { type: Schema.Types.ObjectId, ref: "Module", index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    fileAssetId: {
      type: Schema.Types.ObjectId,
      ref: "FileAsset",
      required: true,
    },
    mimeType: { type: String, required: true },
    originalName: { type: String, required: true },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export const CourseResource = model<ICourseResource>(
  "CourseResource",
  courseResourceSchema,
);
