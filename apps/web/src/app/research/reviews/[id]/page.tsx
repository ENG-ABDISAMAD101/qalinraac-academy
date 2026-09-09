"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ResearchShell,
  researchStatusTone,
} from "@/components/research/ResearchShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { demoReviews } from "@/lib/research-demo-data";
import { cn } from "@/lib/utils";

export default function ResearchReviewDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const item = demoReviews.find((r) => r.id === params.id) ?? demoReviews[0];
  const [comments, setComments] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const isAuthor = item.authorIds.includes(user?._id ?? "");

  function decide(action: "Approve" | "Reject" | "Request Revision") {
    if (isAuthor) {
      setResult("Blocked — researchers cannot approve or decide on their own paper.");
      return;
    }
    if (action === "Request Revision" && !comments.trim()) {
      setResult("Add revision comments before requesting changes.");
      return;
    }
    setResult(`${action} recorded (demo). Author notified.`);
  }

  function onNotes(e: FormEvent) {
    e.preventDefault();
    setResult("Review notes saved (demo).");
  }

  return (
    <ResearchShell>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/research/reviews">← Reviews</Link>
        </Button>
        <div className="card-soft space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-bold text-primary dark:text-foreground">
              {item.paper}
            </h1>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold",
                researchStatusTone(item.status),
              )}
            >
              {item.status}
            </span>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Researcher</dt>
              <dd className="font-semibold">{item.researcher}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="font-semibold">{item.submittedDate}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Abstract</dt>
              <dd className="mt-1 font-medium">{item.abstract}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Full document</dt>
              <dd className="font-semibold">{item.document}</dd>
            </div>
          </dl>

          {isAuthor ? (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              You are an author on this paper. Decision actions are disabled.
            </p>
          ) : null}

          <form onSubmit={onNotes} className="space-y-3">
            <label className="block text-sm font-medium">
              Comments (methodology, results, references)
              <textarea
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
              />
            </label>
            <label className="block text-sm font-medium">
              Recommendations
              <textarea
                rows={2}
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isAuthor}
                onClick={() => decide("Approve")}
              >
                Approve
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isAuthor}
                onClick={() => decide("Request Revision")}
              >
                Request Revision
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isAuthor}
                onClick={() => decide("Reject")}
              >
                Reject
              </Button>
              <Button type="submit" variant="secondary">
                Save notes
              </Button>
            </div>
          </form>
          {result ? (
            <p className="text-sm font-medium text-primary">
              {result}
            </p>
          ) : null}
        </div>
      </div>
    </ResearchShell>
  );
}
