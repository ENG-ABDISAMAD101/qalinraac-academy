export type CourseLifecycleStatus =
  | "draft"
  | "in_progress"
  | "published"
  | "archived";

export type CourseReviewStatus =
  | "none"
  | "pending_review"
  | "changes_requested"
  | "approved";

export type InstructorDisplayStatus = "Draft" | "In Progress" | "Published";

/** Mongo filter: courses/revisions waiting on Academic or Super Admin review. */
export function pendingReviewFilter(): Record<string, unknown> {
  return {
    $or: [
      { status: "in_progress", reviewStatus: "pending_review" },
      // Legacy rows until migrateCourseStatuses runs
      { status: "pending_review" },
      { status: "academic_approved" },
    ],
  };
}

/** Normalize legacy DB values onto the new status + reviewStatus model. */
export function normalizeCourseWorkflow(input: {
  status?: string | null;
  reviewStatus?: string | null;
}): {
  status: CourseLifecycleStatus;
  reviewStatus: CourseReviewStatus;
} {
  const raw = String(input.status ?? "draft");
  const review = String(input.reviewStatus ?? "");

  if (raw === "pending_review") {
    return { status: "in_progress", reviewStatus: "pending_review" };
  }
  if (raw === "academic_approved") {
    return { status: "in_progress", reviewStatus: "approved" };
  }
  if (raw === "rejected") {
    return {
      status: "draft",
      reviewStatus:
        review === "changes_requested" ? "changes_requested" : "changes_requested",
    };
  }
  if (raw === "in_progress") {
    return {
      status: "in_progress",
      reviewStatus: (review as CourseReviewStatus) || "pending_review",
    };
  }
  if (raw === "published") {
    return {
      status: "published",
      reviewStatus: (review as CourseReviewStatus) || "approved",
    };
  }
  if (raw === "archived") {
    return {
      status: "archived",
      reviewStatus: (review as CourseReviewStatus) || "approved",
    };
  }
  return {
    status: "draft",
    reviewStatus: (["none", "pending_review", "changes_requested", "approved"].includes(
      review,
    )
      ? review
      : "none") as CourseReviewStatus,
  };
}

export function instructorDisplayStatus(input: {
  status?: string | null;
  reviewStatus?: string | null;
  liveCourseId?: unknown;
}): InstructorDisplayStatus {
  const { status, reviewStatus } = normalizeCourseWorkflow(input);
  if (status === "published") return "Published";
  if (status === "in_progress" || reviewStatus === "pending_review") {
    return "In Progress";
  }
  return "Draft";
}

export function isCourseUnderReview(input: {
  status?: string | null;
  reviewStatus?: string | null;
}): boolean {
  const { status, reviewStatus } = normalizeCourseWorkflow(input);
  return (
    status === "in_progress" &&
    (reviewStatus === "pending_review" || reviewStatus === "approved")
  );
}

export function assertEditableCourseState(input: {
  status?: string | null;
  reviewStatus?: string | null;
}): void {
  const { status } = normalizeCourseWorkflow(input);
  if (status === "in_progress") {
    throw new Error("LOCKED_IN_REVIEW");
  }
  if (status === "published") {
    throw new Error("LOCKED_PUBLISHED");
  }
  if (status === "archived") {
    throw new Error("LOCKED_ARCHIVED");
  }
}

/** Student-facing published catalog filter. */
export function studentVisibleCourseFilter(): Record<string, unknown> {
  return {
    status: "published",
    isDisabled: { $ne: true },
    liveCourseId: { $exists: false },
  };
}
