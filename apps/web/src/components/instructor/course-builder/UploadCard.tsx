"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { CloudUpload, FileText, ImageIcon, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage, mediaPublicUrl, uploadFileRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

type UploadKind = "image" | "video" | "file";

const ACCEPT: Record<UploadKind, string> = {
  image: "image/*",
  video: "video/*",
  file: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.csv",
};

const FORMATS: Record<UploadKind, string> = {
  image: "JPG, PNG, WEBP",
  video: "MP4, WEBM, MOV",
  file: "PDF, DOCX, PPTX, XLSX, ZIP",
};

const ICON: Record<UploadKind, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  file: FileText,
};

export type UploadCardProps = {
  kind: UploadKind;
  label: string;
  hint?: string;
  value?: string;
  onChange: (
    url: string | undefined,
    meta?: { name: string; size: number; mimeType: string },
  ) => void;
  readOnly?: boolean;
  accept?: string;
  className?: string;
  compact?: boolean;
};

/**
 * Dashed upload card matching the form/modal design system.
 */
export function UploadCard({
  kind,
  label,
  hint,
  value,
  onChange,
  readOnly = false,
  accept,
  className,
  compact = false,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [localName, setLocalName] = useState("");

  const Icon = ICON[kind];
  const publicUrl = mediaPublicUrl(value);

  async function upload(file: File | undefined) {
    if (!file || readOnly) return;
    setUploading(true);
    setError("");
    setLocalName(file.name);
    setProgress(12);
    const tick = window.setInterval(() => {
      setProgress((p) => (p == null || p >= 90 ? p : Math.min(90, p + 10)));
    }, 100);
    try {
      const uploaded = await uploadFileRequest(file);
      if (!uploaded.url) {
        setError("Upload succeeded but no URL was returned.");
        setProgress(null);
        return;
      }
      setProgress(100);
      onChange(uploaded.url, {
        name: uploaded.originalName || file.name,
        size: file.size,
        mimeType: file.type,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Upload failed. Try again."));
      setProgress(null);
      setLocalName("");
    } finally {
      window.clearInterval(tick);
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {value && !readOnly ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={() => {
              onChange(undefined);
              setLocalName("");
              setProgress(null);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        ) : null}
      </div>

      {!publicUrl || uploading ? (
        <div
          onDragOver={(e) => {
            if (readOnly) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            if (readOnly) return;
            e.preventDefault();
            setDragging(false);
            void upload(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center transition-colors",
            compact ? "min-h-[7rem] py-5" : "min-h-[9.5rem] py-8",
            dragging
              ? "border-primary bg-primary/[0.04] dark:border-primary dark:bg-primary/10"
              : "border-border bg-card",
            readOnly && "opacity-70",
          )}
        >
          {uploading ? (
            <div className="w-full max-w-xs space-y-3">
              <Spinner label={`Uploading ${label}`} />
              {progress != null ? (
                <div className="flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {Math.round(progress)} %
                  </span>
                </div>
              ) : null}
              {localName ? (
                <p className="truncate text-xs text-muted-foreground">
                  {localName}
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <CloudUpload className="h-5 w-5" />
              </span>
              <p className="text-sm text-muted-foreground">
                {readOnly ? (
                  "Nothing uploaded"
                ) : (
                  <>
                    Drag &amp; Drop or{" "}
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="font-semibold text-primary hover:underline dark:text-primary"
                    >
                      Choose file
                    </button>{" "}
                    to upload
                  </>
                )}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {hint ?? `Supported formats: ${FORMATS[kind]}`}
              </p>
            </>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/20 text-center",
            compact ? "min-h-[7rem]" : "min-h-[11rem]",
          )}
        >
          {kind === "image" ? (
            <Image
              src={publicUrl}
              alt={label}
              fill
              className="object-cover"
              unoptimized
            />
          ) : kind === "video" ? (
            <video
              src={publicUrl}
              controls
              className="h-full max-h-[16rem] w-full bg-black object-contain"
            />
          ) : (
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-2 px-4 py-6 text-sm font-medium text-primary underline-offset-4 hover:underline dark:text-primary"
            >
              <Icon className="h-6 w-6" />
              View uploaded file
            </a>
          )}
        </div>
      )}

      {!readOnly ? (
        <input
          ref={inputRef}
          type="file"
          accept={accept ?? ACCEPT[kind]}
          className="sr-only"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
