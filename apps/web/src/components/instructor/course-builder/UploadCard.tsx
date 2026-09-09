"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { FileText, ImageIcon, Trash2, UploadCloud, Video } from "lucide-react";
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
  onChange: (url: string | undefined, meta?: { name: string; size: number; mimeType: string }) => void;
  readOnly?: boolean;
  accept?: string;
  className?: string;
  /** Compact height for dense side panels. */
  compact?: boolean;
};

/**
 * Dashed upload card that pushes the file to storage via `uploadFileRequest`
 * and reports back the stored URL. Upload is the only supported input — the
 * builder never accepts pasted media URLs.
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
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const Icon = ICON[kind];
  const publicUrl = mediaPublicUrl(value);

  async function upload(file: File | undefined) {
    if (!file || readOnly) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadFileRequest(file);
      if (!uploaded.url) {
        setError("Upload succeeded but no URL was returned.");
        return;
      }
      onChange(uploaded.url, {
        name: uploaded.originalName || file.name,
        size: file.size,
        mimeType: file.type,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Upload failed. Try again."));
    } finally {
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
            onClick={() => onChange(undefined)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        ) : null}
      </div>

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
          "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/30 text-center transition-colors",
          compact ? "min-h-[7rem]" : "min-h-[11rem]",
          dragging && "border-brand-lime bg-brand-lime-soft/40",
          readOnly && "opacity-70",
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <Spinner label={`Uploading ${label}`} />
            <p className="text-xs text-muted-foreground">Uploading…</p>
          </div>
        ) : publicUrl && kind === "image" ? (
          <Image
            src={publicUrl}
            alt={label}
            fill
            className="object-cover"
            unoptimized
          />
        ) : publicUrl && kind === "video" ? (
          <video
            src={publicUrl}
            controls
            className="h-full max-h-[16rem] w-full bg-black object-contain"
          />
        ) : publicUrl ? (
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-2 px-4 py-6 text-sm font-medium text-brand-navy underline-offset-4 hover:underline dark:text-brand-lime"
          >
            <FileText className="h-6 w-6" />
            View uploaded file
          </a>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-navy/5 text-brand-navy dark:bg-brand-lime/10 dark:text-brand-lime">
              <Icon className="h-5 w-5" />
            </span>
            <p className="text-xs text-muted-foreground">
              {readOnly ? "Nothing uploaded" : hint ?? "Drag & drop or browse"}
            </p>
          </div>
        )}
      </div>

      {!readOnly ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={accept ?? ACCEPT[kind]}
            className="hidden"
            onChange={(e) => void upload(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud className="h-4 w-4" />
            {value ? "Replace" : "Upload"}
          </Button>
          {hint && value ? (
            <span className="text-xs text-muted-foreground">{hint}</span>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
