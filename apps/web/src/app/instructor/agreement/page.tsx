"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { InstructorShell } from "@/components/instructor/InstructorShell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  getApiErrorMessage,
  instructorAgreementsRequest,
  mediaPublicUrl,
} from "@/lib/api";

type AgreementItem = Awaited<
  ReturnType<typeof instructorAgreementsRequest>
>["items"][number];

export default function InstructorAgreementPage() {
  const [items, setItems] = useState<AgreementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await instructorAgreementsRequest();
        if (!cancelled) setItems(data.items);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load agreements."));
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <InstructorShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Instructor Agreement
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and download only — managed by Academic / Super Admin
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading agreements" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : items.length === 0 ? (
          <div className="card-soft px-5 py-12 text-center text-sm text-muted-foreground">
            No agreements assigned yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((a) => {
              const href = mediaPublicUrl(a.fileUrl);
              return (
                <li key={a.id} className="card-soft space-y-3 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {a.courseTitle}
                      </p>
                      {a.courseDescription ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {a.courseDescription}
                        </p>
                      ) : null}
                    </div>
                    {href ? (
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={a.fileName}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {a.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Version {a.version}
                    {a.fileName ? ` · ${a.fileName}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </InstructorShell>
  );
}
