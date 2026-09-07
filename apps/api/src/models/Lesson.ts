import { Schema, model, type Document, type Types } from "mongoose";

export interface ILesson extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId;
  title: string;
  content?: string;
  videoUrl?: string;
  order: number;
  durationMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    moduleId: { type: Schema.Types.ObjectId, ref: "Module", required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String },
    videoUrl: { type: String },
    order: { type: Number, default: 0 },
    durationMinutes: { type: Number },
  },
  { timestamps: true },
);

export const Lesson = model<ILesson>("Lesson", lessonSchema);
