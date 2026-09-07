import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import { Enrollment } from "../../models/Enrollment.js";
import { Lesson } from "../../models/Lesson.js";
import { Progress } from "../../models/Progress.js";

export const completeLessonSchema = z.object({
  lessonId: z.string().min(1),
  courseId: z.string().min(1),
});

export async function markLessonComplete(
  userId: string,
  input: z.infer<typeof completeLessonSchema>,
) {
  const enrollment = await Enrollment.findOne({
    userId,
    courseId: input.courseId,
    status: { $in: ["active", "completed"] },
  });
  if (!enrollment) {
    throw new AppError(403, "NOT_ENROLLED", "Active enrollment required");
  }

  const lesson = await Lesson.findOne({ _id: input.lessonId, courseId: input.courseId });
  if (!lesson) throw new AppError(404, "NOT_FOUND", "Lesson not found");

  const progress = await Progress.findOneAndUpdate(
    { userId, lessonId: input.lessonId },
    {
      userId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      completed: true,
      completedAt: new Date(),
    },
    { upsert: true, new: true },
  );

  const totalLessons = await Lesson.countDocuments({ courseId: input.courseId });
  const completedLessons = await Progress.countDocuments({
    userId,
    courseId: input.courseId,
    completed: true,
  });
  const percent =
    totalLessons === 0 ? 0 : Math.min(100, Math.round((completedLessons / totalLessons) * 100));

  enrollment.progressPercent = percent;
  if (percent >= 100) {
    enrollment.status = "completed";
    enrollment.completedAt = new Date();
  }
  await enrollment.save();

  return { progress, enrollment };
}

export async function getProgress(userId: string, courseId: string) {
  const enrollment = await Enrollment.findOne({ userId, courseId });
  if (!enrollment) throw new AppError(404, "NOT_FOUND", "Enrollment not found");
  const lessons = await Progress.find({ userId, courseId });
  return { enrollment, lessons };
}
