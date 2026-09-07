import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import { Assignment } from "../../models/Assignment.js";
import { Submission } from "../../models/Submission.js";

export const createAssignmentSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  maxScore: z.number().int().min(1).optional(),
  dueAt: z.coerce.date().optional(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const submitSchema = z.object({
  content: z.string().optional(),
  fileAssetId: z.string().optional(),
});

export const gradeSchema = z.object({
  score: z.number().min(0),
  feedback: z.string().optional(),
});

export async function createAssignment(
  input: z.infer<typeof createAssignmentSchema>,
  actorId: string,
) {
  return Assignment.create({ ...input, createdBy: actorId, maxScore: input.maxScore ?? 100 });
}

export async function listAssignments(courseId?: string) {
  const filter = courseId ? { courseId } : {};
  return Assignment.find(filter).sort({ createdAt: -1 });
}

export async function getAssignment(id: string) {
  const assignment = await Assignment.findById(id);
  if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
  return assignment;
}

export async function updateAssignment(
  id: string,
  input: z.infer<typeof updateAssignmentSchema>,
) {
  const assignment = await Assignment.findByIdAndUpdate(id, input, { new: true });
  if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
  return assignment;
}

export async function deleteAssignment(id: string) {
  const assignment = await Assignment.findByIdAndDelete(id);
  if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
  return { deleted: true };
}

export async function submitAssignment(
  assignmentId: string,
  userId: string,
  input: z.infer<typeof submitSchema>,
) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
  if (!input.content && !input.fileAssetId) {
    throw new AppError(400, "EMPTY_SUBMISSION", "Provide content or fileAssetId");
  }

  const submission = await Submission.findOneAndUpdate(
    { assignmentId, userId },
    {
      assignmentId,
      userId,
      content: input.content,
      fileAssetId: input.fileAssetId,
      status: "submitted",
      score: undefined,
      feedback: undefined,
      gradedBy: undefined,
      gradedAt: undefined,
    },
    { upsert: true, new: true },
  );

  return submission;
}

export async function gradeSubmission(
  assignmentId: string,
  userId: string,
  input: z.infer<typeof gradeSchema>,
  graderId: string,
) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
  if (input.score > assignment.maxScore) {
    throw new AppError(400, "INVALID_SCORE", `Score cannot exceed ${assignment.maxScore}`);
  }

  const submission = await Submission.findOne({ assignmentId, userId });
  if (!submission) throw new AppError(404, "NOT_FOUND", "Submission not found");

  submission.score = input.score;
  submission.feedback = input.feedback;
  submission.status = "graded";
  submission.gradedBy = graderId as never;
  submission.gradedAt = new Date();
  await submission.save();
  return submission;
}

export async function listSubmissions(assignmentId: string) {
  return Submission.find({ assignmentId }).populate("userId", "email fullName");
}
