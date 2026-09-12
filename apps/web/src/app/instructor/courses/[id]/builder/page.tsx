"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { InstructorShell } from "@/components/instructor/InstructorShell";
import { CourseBuilderShell } from "@/components/instructor/course-builder/CourseBuilderShell";
import { BasicInfoStep } from "@/components/instructor/course-builder/steps/BasicInfoStep";
import { AssessmentStep } from "@/components/instructor/course-builder/steps/AssessmentStep";
import { CurriculumStep } from "@/components/instructor/course-builder/steps/CurriculumStep";
import { DescriptionStep } from "@/components/instructor/course-builder/steps/DescriptionStep";
import { IntroVideoStep } from "@/components/instructor/course-builder/steps/IntroVideoStep";
import { LessonsStep } from "@/components/instructor/course-builder/steps/LessonsStep";
import { OutcomesStep } from "@/components/instructor/course-builder/steps/OutcomesStep";
import { PricingStep } from "@/components/instructor/course-builder/steps/PricingStep";
import { RequirementsStep } from "@/components/instructor/course-builder/steps/RequirementsStep";
import { ReviewStep } from "@/components/instructor/course-builder/steps/ReviewStep";
import {
  MISSING_LABELS,
  clampStep,
  type AccessDuration,
  type BuilderStepNumber,
  type CourseDraft,
  type SaveStatus,
} from "@/components/instructor/course-builder/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  getApiErrorMessage,
  instructorCourseRequest,
  instructorSaveDraftRequest,
  instructorSubmitCourseRequest,
  instructorUpdateCourseRequest,
  type CourseCategory,
  type InstructorCourseDetail,
  type InstructorCourseInput,
  type InstructorModule,
} from "@/lib/api";

const EMPTY_DRAFT: CourseDraft = {
  title: "",
  description: "",
  category: "",
  language: "en",
  level: "beginner",
  learningOutcomes: [],
  requirements: [],
  targetAudience: [],
  isFree: true,
  priceCents: 0,
  accessDuration: "lifetime",
  currency: "USD",
  thumbnailUrl: "",
  promoVideoUrl: "",
};

function toDraft(course: InstructorCourseDetail): CourseDraft {
  return {
    title: course.title ?? "",
    description: course.description ?? "",
    category: (course.category as CourseCategory) ?? "",
    language: course.language ?? "en",
    level: course.level ?? "beginner",
    learningOutcomes: course.learningOutcomes ?? [],
    requirements: course.requirements ?? [],
    targetAudience: course.targetAudience ?? [],
    isFree: course.isFree ?? course.priceCents === 0,
    priceCents: course.priceCents ?? 0,
    accessDuration: (course.accessDuration as AccessDuration) ?? "lifetime",
    currency: course.currency ?? "USD",
    thumbnailUrl: course.thumbnailUrl ?? "",
    promoVideoUrl: course.promoVideoUrl ?? "",
  };
}

/** Maps builder fields to the API payload, dropping values the API rejects. */
function toApiPatch(patch: Partial<CourseDraft>): InstructorCourseInput {
  const payload: InstructorCourseInput = {};
  if (patch.title !== undefined && patch.title.trim().length >= 3) {
    payload.title = patch.title.trim();
  }
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.category) payload.category = patch.category;
  if (patch.language) payload.language = patch.language;
  if (patch.level) payload.level = patch.level;
  if (patch.learningOutcomes !== undefined) {
    payload.learningOutcomes = patch.learningOutcomes;
  }
  if (patch.requirements !== undefined) payload.requirements = patch.requirements;
  if (patch.targetAudience !== undefined) {
    payload.targetAudience = patch.targetAudience;
  }
  if (patch.isFree !== undefined) payload.isFree = patch.isFree;
  if (patch.priceCents !== undefined) payload.priceCents = patch.priceCents;
  if (patch.accessDuration) payload.accessDuration = patch.accessDuration;
  if (patch.currency) payload.currency = patch.currency;
  if (patch.thumbnailUrl !== undefined) payload.thumbnailUrl = patch.thumbnailUrl;
  if (patch.promoVideoUrl !== undefined) {
    payload.promoVideoUrl = patch.promoVideoUrl;
  }
  return payload;
}

function submitMissingMessage(err: unknown) {
  const missing = (
    err as {
      response?: { data?: { error?: { details?: { missing?: string[] } } } };
    }
  )?.response?.data?.error?.details?.missing;
  if (!missing?.length) return "";
  return `Still missing: ${missing
    .map((key) => MISSING_LABELS[key] ?? key)
    .join(", ")}.`;
}

export default function CourseBuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = params.id;

  const [draft, setDraftState] = useState<CourseDraft>(EMPTY_DRAFT);
  const [curriculum, setCurriculum] = useState<InstructorModule[]>([]);
  const [status, setStatus] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [isRevisionDraft, setIsRevisionDraft] = useState(false);
  const [displayStatus, setDisplayStatus] = useState<string>("");
  const [step, setStep] = useState<BuilderStepNumber>(1);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const pendingRef = useRef<InstructorCourseInput>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const readOnly =
    status === "in_progress" ||
    reviewStatus === "pending_review" ||
    status === "pending_review" ||
    status === "archived";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!courseId) return;
      setLoading(true);
      setLoadError("");
      try {
        const course = await instructorCourseRequest(courseId);
        if (cancelled) return;
        setDraftState(toDraft(course));
        setCurriculum(course.curriculum ?? []);
        setStatus(course.status);
        setReviewStatus(course.reviewStatus ?? "");
        setIsRevisionDraft(Boolean(course.liveCourseId || course.isRevisionDraft));
        setDisplayStatus(course.displayStatus ?? "");
        const fromQuery =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("step")
            : null;
        setStep(clampStep(fromQuery ?? course.builderStep ?? 1));
      } catch (err) {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(err, "Could not load the builder."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    },
    [],
  );

  const markSaved = useCallback(() => {
    setSaveStatus("saved");
    setLastSavedAt(new Date());
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2500);
  }, []);

  /** Sends everything queued so far; safe to call repeatedly. */
  const flush = useCallback(
    async (extra?: InstructorCourseInput) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const payload = { ...pendingRef.current, ...extra };
      pendingRef.current = {};
      if (!Object.keys(payload).length) return true;

      setSaveStatus("saving");
      try {
        const updated = await instructorUpdateCourseRequest(courseId, payload);
        setStatus(updated.status);
        setSaveError("");
        markSaved();
        return true;
      } catch (err) {
        setSaveStatus("error");
        setSaveError(getApiErrorMessage(err, "Could not save your changes."));
        return false;
      }
    },
    [courseId, markSaved],
  );

  const setDraft = useCallback(
    (patch: Partial<CourseDraft>) => {
      setDraftState((prev) => ({ ...prev, ...patch }));
      if (readOnly) return;
      const apiPatch = toApiPatch(patch);
      if (!Object.keys(apiPatch).length) return;
      pendingRef.current = { ...pendingRef.current, ...apiPatch };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void flush(), 800);
    },
    [flush, readOnly],
  );

  const reloadCurriculum = useCallback(async () => {
    if (!courseId) return;
    try {
      const course = await instructorCourseRequest(courseId);
      setCurriculum(course.curriculum ?? []);
      setStatus(course.status);
    } catch (err) {
      setSaveError(getApiErrorMessage(err, "Could not refresh the curriculum."));
    }
  }, [courseId]);

  const goToStep = useCallback(
    (next: BuilderStepNumber) => {
      const target = clampStep(next);
      if (target === step) return;
      setStep(target);
      setActionMessage("");
      setActionError("");
      router.replace(`/instructor/courses/${courseId}/builder?step=${target}`, {
        scroll: false,
      });
      if (readOnly) return;
      void flush({ builderStep: target });
    },
    [courseId, flush, readOnly, router, step],
  );

  async function onSaveDraft() {
    setActionBusy(true);
    setActionError("");
    setActionMessage("");
    try {
      await flush({ builderStep: step });
      const course = await instructorSaveDraftRequest(courseId);
      setStatus(course.status);
      setActionMessage("Draft saved.");
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Could not save the draft."));
    } finally {
      setActionBusy(false);
    }
  }

  async function onMarkComplete() {
    setActionError("");
    setActionMessage("");
    try {
      await flush({ builderStep: step });
      const course = await instructorSubmitCourseRequest(courseId);
      setStatus(course.status);
      setActionMessage("Course submitted for Academic review.");
    } catch (err) {
      const detail = submitMissingMessage(err);
      const message = [
        getApiErrorMessage(err, "Could not mark the course as complete."),
        detail,
      ]
        .filter(Boolean)
        .join(" ");
      setActionError(message);
      throw new Error(message);
    }
  }

  const completedSteps = useMemo(() => {
    const lessons = curriculum.flatMap((m) => m.lessons);
    const done = new Set<number>();
    if (
      draft.title.trim().length >= 3 &&
      draft.category &&
      draft.language &&
      draft.level
    ) {
      done.add(1);
    }
    if (draft.description.trim()) done.add(2);
    if (draft.learningOutcomes.length > 0) done.add(3);
    done.add(4);
    if (curriculum.length > 0) done.add(5);
    if (lessons.length > 0) done.add(6);
    done.add(7);
    done.add(8); // Intro video optional
    done.add(9); // Pricing
    if (
      status === "in_progress" ||
      status === "pending_review" ||
      status === "published"
    ) {
      done.add(10);
    }
    return done;
  }, [curriculum, draft, status]);

  const readyToPublish =
    completedSteps.has(1) &&
    completedSteps.has(2) &&
    completedSteps.has(3) &&
    completedSteps.has(5) &&
    completedSteps.has(6) &&
    status !== "in_progress" &&
    status !== "pending_review" &&
    status !== "archived";

  const stepProps = {
    courseId,
    draft,
    setDraft,
    readOnly,
    curriculum,
    reloadCurriculum,
  };

  if (loading) {
    return (
      <InstructorShell>
        <div className="relative flex min-h-[50vh] items-center justify-center">
          <Spinner center label="Loading course builder" />
        </div>
      </InstructorShell>
    );
  }

  if (loadError) {
    return (
      <InstructorShell>
        <div className="space-y-4 px-4 py-6 sm:px-6 lg:px-8">
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {loadError}
          </p>
          <Button type="button" variant="outline" onClick={() => router.refresh()}>
            Try again
          </Button>
        </div>
      </InstructorShell>
    );
  }

  return (
    <InstructorShell>
      <CourseBuilderShell
        courseId={courseId}
        courseTitle={draft.title}
        status={status}
        displayStatus={displayStatus}
        reviewStatus={reviewStatus}
        isRevisionDraft={isRevisionDraft}
        readOnly={readOnly}
        step={step}
        onStepChange={goToStep}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        saveError={saveError}
        completedSteps={completedSteps}
        readyToPublish={readyToPublish}
        onSaveDraft={() => void onSaveDraft()}
        onMarkComplete={onMarkComplete}
        actionBusy={actionBusy}
        actionMessage={actionMessage}
        actionError={actionError}
      >
        {step === 1 ? <BasicInfoStep {...stepProps} /> : null}
        {step === 2 ? <DescriptionStep {...stepProps} /> : null}
        {step === 3 ? <OutcomesStep {...stepProps} /> : null}
        {step === 4 ? <RequirementsStep {...stepProps} /> : null}
        {step === 5 ? <CurriculumStep {...stepProps} /> : null}
        {step === 6 ? <LessonsStep {...stepProps} /> : null}
        {step === 7 ? <AssessmentStep {...stepProps} /> : null}
        {step === 8 ? <IntroVideoStep {...stepProps} /> : null}
        {step === 9 ? <PricingStep {...stepProps} /> : null}
        {step === 10 ? (
          <ReviewStep
            {...stepProps}
            status={status}
            onGoToStep={goToStep}
          />
        ) : null}
      </CourseBuilderShell>
    </InstructorShell>
  );
}
