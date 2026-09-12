import { Course } from "../models/Course.js";
import { normalizeCourseWorkflow } from "../lib/course-workflow.js";
import { logger } from "../lib/logger.js";

/** One-shot / idempotent migration of legacy course statuses. */
export async function migrateCourseStatuses() {
  const rows = await Course.find({
    $or: [
      { status: { $in: ["pending_review", "academic_approved", "rejected"] } },
      { reviewStatus: { $exists: false } },
      { isDisabled: { $exists: false } },
    ],
  } as Record<string, unknown>).select("_id status reviewStatus isDisabled");

  let updated = 0;
  for (const row of rows) {
    const next = normalizeCourseWorkflow({
      status: row.status,
      reviewStatus: row.reviewStatus,
    });
    let dirty = false;
    if (String(row.status) !== next.status) {
      row.set("status", next.status);
      dirty = true;
    }
    if (String(row.reviewStatus ?? "") !== next.reviewStatus) {
      row.set("reviewStatus", next.reviewStatus);
      dirty = true;
    }
    if (row.isDisabled == null) {
      row.isDisabled = false;
      dirty = true;
    }
    if (dirty) {
      await row.save();
      updated += 1;
    }
  }

  if (updated) {
    logger.info(`Migrated course statuses (${updated})`);
  }
}
