import { Schema, model, type Document, type Types } from "mongoose";

/** Snapshot recorded when a revision is published onto the live course. */
export interface ICourseRevisionHistory extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  revisionCourseId?: Types.ObjectId;
  version: number;
  title: string;
  changeSummary: string[];
  publishedBy?: Types.ObjectId;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const courseRevisionHistorySchema = new Schema<ICourseRevisionHistory>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    revisionCourseId: { type: Schema.Types.ObjectId, ref: "Course" },
    version: { type: Number, required: true, min: 1 },
    title: { type: String, required: true },
    changeSummary: [{ type: String }],
    publishedBy: { type: Schema.Types.ObjectId, ref: "User" },
    publishedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

export const CourseRevisionHistory = model<ICourseRevisionHistory>(
  "CourseRevisionHistory",
  courseRevisionHistorySchema,
);
