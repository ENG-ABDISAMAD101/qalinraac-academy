import { Schema, model, type Document, type Types } from "mongoose";

export interface IQuizAttempt extends Document {
  _id: Types.ObjectId;
  quizId: Types.ObjectId;
  userId: Types.ObjectId;
  answers: number[];
  score: number;
  maxScore: number;
  passed: boolean;
  /** When failed: pending_review until instructor allows retake. */
  reviewStatus: "none" | "pending_review" | "retake_allowed";
  instructorFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    answers: [{ type: Number, required: true }],
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    reviewStatus: {
      type: String,
      enum: ["none", "pending_review", "retake_allowed"],
      default: "none",
    },
    instructorFeedback: { type: String },
  },
  { timestamps: true },
);

export const QuizAttempt = model<IQuizAttempt>("QuizAttempt", quizAttemptSchema);
