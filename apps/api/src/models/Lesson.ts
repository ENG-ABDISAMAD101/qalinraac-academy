import { Schema, model, type Document, type Types } from "mongoose";

export type LessonContentType =
  | "video"
  | "article"
  | "pdf"
  | "slides"
  | "zip"
  | "external";

export interface ILessonAttachment {
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
}

export interface ILesson extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId;
  title: string;
  description?: string;
  content?: string;
  contentType: LessonContentType;
  videoUrl?: string;
  externalUrl?: string;
  attachments: ILessonAttachment[];
  order: number;
  durationMinutes?: number;
  isPreview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    moduleId: { type: Schema.Types.ObjectId, ref: "Module", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    content: { type: String },
    contentType: {
      type: String,
      enum: ["video", "article", "pdf", "slides", "zip", "external"],
      default: "video",
    },
    videoUrl: { type: String },
    externalUrl: { type: String },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        mimeType: { type: String },
        size: { type: Number },
      },
    ],
    order: { type: Number, default: 0 },
    durationMinutes: { type: Number },
    isPreview: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Lesson = model<ILesson>("Lesson", lessonSchema);
