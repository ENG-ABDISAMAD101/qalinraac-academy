import { Schema, model, type Document, type Types } from "mongoose";

export interface IAssignment extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId?: Types.ObjectId;
  title: string;
  description?: string;
  maxScore: number;
  dueAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson" },
    title: { type: String, required: true },
    description: { type: String },
    maxScore: { type: Number, default: 100 },
    dueAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Assignment = model<IAssignment>("Assignment", assignmentSchema);
