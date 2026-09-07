import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import { writeAuditLog } from "../../lib/audit.js";
import { ResearchProject } from "../../models/ResearchProject.js";
import { createNotification } from "../notifications/notifications.service.js";

export const createResearchSchema = z.object({
  title: z.string().min(2).max(300),
  abstract: z.string().max(5000).optional(),
  fileAssetId: z.string().optional(),
  submit: z.boolean().optional(),
});

export const updateResearchSchema = createResearchSchema.partial();

export const reviewSchema = z.object({
  status: z.enum(["under_review", "approved", "rejected"]),
  reviewNotes: z.string().max(2000).optional(),
});

export async function createProject(
  input: z.infer<typeof createResearchSchema>,
  authorId: string,
) {
  return ResearchProject.create({
    title: input.title,
    abstract: input.abstract,
    fileAssetId: input.fileAssetId,
    authorId,
    status: input.submit ? "submitted" : "draft",
  });
}

export async function listProjects(filters?: { authorId?: string; status?: string }) {
  const filter: Record<string, unknown> = {};
  if (filters?.authorId) filter.authorId = filters.authorId;
  if (filters?.status) filter.status = filters.status;
  return ResearchProject.find(filter)
    .populate("authorId", "email fullName")
    .sort({ createdAt: -1 });
}

export async function getProject(id: string) {
  const project = await ResearchProject.findById(id).populate("authorId", "email fullName");
  if (!project) throw new AppError(404, "NOT_FOUND", "Research project not found");
  return project;
}

export async function updateProject(
  id: string,
  input: z.infer<typeof updateResearchSchema>,
  userId: string,
) {
  const project = await ResearchProject.findById(id);
  if (!project) throw new AppError(404, "NOT_FOUND", "Research project not found");
  if (String(project.authorId) !== userId) {
    throw new AppError(403, "FORBIDDEN", "Only the author can update this project");
  }
  if (input.title !== undefined) project.title = input.title;
  if (input.abstract !== undefined) project.abstract = input.abstract;
  if (input.fileAssetId !== undefined) project.fileAssetId = input.fileAssetId as never;
  if (input.submit) project.status = "submitted";
  await project.save();
  return project;
}

export async function reviewProject(
  id: string,
  input: z.infer<typeof reviewSchema>,
  reviewerId: string,
) {
  const project = await ResearchProject.findById(id);
  if (!project) throw new AppError(404, "NOT_FOUND", "Research project not found");

  project.status = input.status;
  project.reviewNotes = input.reviewNotes;
  project.reviewedBy = reviewerId as never;
  project.reviewedAt = new Date();
  await project.save();

  await writeAuditLog({
    actorId: reviewerId,
    action: "research.review",
    resource: "ResearchProject",
    resourceId: id,
    meta: { status: input.status },
  });

  await createNotification({
    userId: String(project.authorId),
    title: "Research review update",
    body: `Your project status is now ${input.status}.`,
    type: "research",
    meta: { projectId: id },
  });

  return project;
}
