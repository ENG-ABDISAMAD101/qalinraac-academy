import { Schema, model, type Document, type Types } from "mongoose";

export interface IQuizAttempt extends Document {
  _id: Types.ObjectId;
  quizId: Types.ObjectId;
  userId: Types.ObjectId;
  answers: number[];
  score: number;
  maxScore: number;
  passed: boolean;
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
  },
  { timestamps: true },
);

export const QuizAttempt = model<IQuizAttempt>("QuizAttempt", quizAttemptSchema);
