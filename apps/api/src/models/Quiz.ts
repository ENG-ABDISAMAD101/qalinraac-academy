import { Schema, model, type Document, type Types } from "mongoose";

export interface IQuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  points: number;
}

export interface IQuiz extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId?: Types.ObjectId;
  title: string;
  description?: string;
  questions: IQuizQuestion[];
  passingScore: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson" },
    title: { type: String, required: true },
    description: { type: String },
    questions: [
      {
        prompt: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctIndex: { type: Number, required: true },
        points: { type: Number, default: 1 },
      },
    ],
    passingScore: { type: Number, default: 70 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Quiz = model<IQuiz>("Quiz", quizSchema);
