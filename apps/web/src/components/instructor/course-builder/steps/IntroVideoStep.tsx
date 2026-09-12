"use client";

import { useMemo, useState } from "react";
import { Link2, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StepProps } from "../types";

/** Accept common YouTube URL shapes and return a clean watch URL + embed id. */
export function parseYouTubeUrl(raw: string): {
  watchUrl: string;
  embedId: string;
} | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(value)
      ? value
      : `https://${value}`;
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname.startsWith("/embed/")) {
        id = url.pathname.split("/")[2] ?? "";
      } else if (url.pathname.startsWith("/shorts/")) {
        id = url.pathname.split("/")[2] ?? "";
      } else {
        id = url.searchParams.get("v") ?? "";
      }
    }
    if (!id || !/^[a-zA-Z0-9_-]{6,}$/.test(id)) return null;
    return {
      watchUrl: `https://www.youtube.com/watch?v=${id}`,
      embedId: id,
    };
  } catch {
    return null;
  }
}

export function IntroVideoStep({ draft, setDraft, readOnly }: StepProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(draft.promoVideoUrl || "");
  const [error, setError] = useState("");

  const parsed = useMemo(
    () => parseYouTubeUrl(draft.promoVideoUrl || ""),
    [draft.promoVideoUrl],
  );

  function openModal() {
    setUrlInput(draft.promoVideoUrl || "");
    setError("");
    setModalOpen(true);
  }

  function saveUrl() {
    const next = parseYouTubeUrl(urlInput);
    if (!next) {
      setError("Enter a valid YouTube URL (youtube.com or youtu.be).");
      return;
    }
    setDraft({ promoVideoUrl: next.watchUrl });
    setModalOpen(false);
    setError("");
  }

  function clearVideo() {
    setDraft({ promoVideoUrl: "" });
    setUrlInput("");
    setError("");
  }

  return (
    <div className="card-soft mx-auto max-w-2xl space-y-6 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-primary dark:text-foreground">
          Intro video
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a YouTube trailer students see on the course page.
        </p>
      </div>

      {parsed ? (
        <div className="space-y-4">
          <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
            <iframe
              title="Course intro video"
              src={`https://www.youtube.com/embed/${parsed.embedId}`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {parsed.watchUrl}
          </p>
          {!readOnly ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={openModal}>
                <Link2 className="h-4 w-4" />
                Change URL
              </Button>
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={clearVideo}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground dark:bg-[#1A1A1A]">
            <Play className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-foreground">
            No intro video yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Paste a YouTube link to preview your course trailer here.
          </p>
          {!readOnly ? (
            <Button type="button" className="mt-5" onClick={openModal}>
              <Link2 className="h-4 w-4" />
              Add YouTube URL
            </Button>
          ) : null}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>YouTube intro video</DialogTitle>
            <DialogDescription>
              Paste a public YouTube link. Students will watch it as the course
              trailer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="intro-youtube-url">YouTube URL</Label>
            <Input
              id="intro-youtube-url"
              value={urlInput}
              placeholder="https://www.youtube.com/watch?v=…"
              onChange={(e) => {
                setUrlInput(e.target.value);
                setError("");
              }}
              autoFocus
            />
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Supports youtube.com/watch, youtu.be, and /shorts links.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveUrl}>
              Save video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
