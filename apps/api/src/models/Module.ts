import { Schema, model, type Document, type Types } from "mongoose";

export interface IModule extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const moduleSchema = new Schema<IModule>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Module = model<IModule>("Module", moduleSchema);
