import { Schema, model, type Document, type Types } from "mongoose";

/**
 * Thread messages for course review (Academic/SuperAdmin ↔ Instructor)
 * or assignment feedback (Student ↔ Instructor).
 */
export interface IDiscussionMessage extends Document {
  _id: Types.ObjectId;
  courseId?: Types.ObjectId;
  assignmentId?: Types.ObjectId;
  authorId: Types.ObjectId;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const discussionMessageSchema = new Schema<IDiscussionMessage>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      index: true,
    },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

discussionMessageSchema.pre("validate", function () {
  if (!this.courseId && !this.assignmentId) {
    this.invalidate("assignmentId", "courseId or assignmentId is required");
  }
});

export const DiscussionMessage = model<IDiscussionMessage>(
  "DiscussionMessage",
  discussionMessageSchema,
);
