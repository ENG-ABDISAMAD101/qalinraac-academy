import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import { Quiz } from "../../models/Quiz.js";
import { QuizAttempt } from "../../models/QuizAttempt.js";

const questionSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correctIndex: z.number().int().min(0),
  points: z.number().int().min(1).default(1),
});

export const createQuizSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1),
  passingScore: z.number().min(0).max(100).optional(),
});

export const updateQuizSchema = createQuizSchema.partial();

export const attemptQuizSchema = z.object({
  answers: z.array(z.number().int().min(0)),
});

export async function createQuiz(
  input: z.infer<typeof createQuizSchema>,
  actorId: string,
) {
  return Quiz.create({
    ...input,
    passingScore: input.passingScore ?? 70,
    createdBy: actorId,
  });
}

export async function listQuizzes(courseId?: string) {
  const filter = courseId ? { courseId } : {};
  return Quiz.find(filter).sort({ createdAt: -1 });
}

export async function getQuiz(id: string, hideAnswers = false) {
  const quiz = await Quiz.findById(id);
  if (!quiz) throw new AppError(404, "NOT_FOUND", "Quiz not found");
  if (!hideAnswers) return quiz;
  const safe = quiz.toObject();
  safe.questions = safe.questions.map((q) => ({
    prompt: q.prompt,
    options: q.options,
    points: q.points,
    correctIndex: -1,
  }));
  return safe;
}

export async function updateQuiz(id: string, input: z.infer<typeof updateQuizSchema>) {
  const quiz = await Quiz.findByIdAndUpdate(id, input, { new: true });
  if (!quiz) throw new AppError(404, "NOT_FOUND", "Quiz not found");
  return quiz;
}

export async function deleteQuiz(id: string) {
  const quiz = await Quiz.findByIdAndDelete(id);
  if (!quiz) throw new AppError(404, "NOT_FOUND", "Quiz not found");
  return { deleted: true };
}

export async function attemptQuiz(
  quizId: string,
  userId: string,
  input: z.infer<typeof attemptQuizSchema>,
) {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new AppError(404, "NOT_FOUND", "Quiz not found");
  if (input.answers.length !== quiz.questions.length) {
    throw new AppError(400, "INVALID_ANSWERS", "Answer count must match questions");
  }

  let score = 0;
  let maxScore = 0;
  quiz.questions.forEach((q, i) => {
    maxScore += q.points;
    if (input.answers[i] === q.correctIndex) score += q.points;
  });

  const percent = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);
  const passed = percent >= quiz.passingScore;

  const attempt = await QuizAttempt.create({
    quizId,
    userId,
    answers: input.answers,
    score,
    maxScore,
    passed,
  });

  return { attempt, percent, passed };
}
