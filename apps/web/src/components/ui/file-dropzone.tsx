"use client";

import { CloudUpload, FileSpreadsheet, FileText, X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

function FileTypeIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (/\.(xls|xlsx|csv)$/.test(lower)) {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
        <FileSpreadsheet className="h-5 w-5" />
      </span>
    );
  }
  if (/\.pdf$/.test(lower)) {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <FileText className="h-5 w-5" />
      </span>
    );
  }
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary dark:bg-primary/15 dark:text-primary">
      <FileText className="h-5 w-5" />
    </span>
  );
}

export type FileDropzoneProps = {
  accept?: string;
  formatsLabel?: string;
  disabled?: boolean;
  file?: File | null;
  progress?: number | null;
  onFileChange: (file: File | null) => void;
  className?: string;
  id?: string;
};

export function FileDropzone({
  accept,
  formatsLabel = "CSV, XLS, XLSX",
  disabled = false,
  file = null,
  progress = null,
  onFileChange,
  className,
  id = "file-dropzone-input",
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  function pick(next?: File | null) {
    if (disabled) return;
    onFileChange(next ?? null);
    if (!next && inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) pick(dropped);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-9 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/[0.04] dark:border-primary dark:bg-primary/10"
            : "border-border bg-card",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <CloudUpload className="h-5 w-5" strokeWidth={2} />
        </span>
        <p className="text-sm text-muted-foreground">
          Drag &amp; Drop or{" "}
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="font-semibold text-primary hover:underline dark:text-primary"
          >
            Choose file
          </button>{" "}
          to upload
        </p>
        <p className="mt-1.5 text-xs text-text-muted">
          Supported formats: {formatsLabel}
        </p>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </div>

      {file ? (
        <div className="rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm dark:bg-card">
          <div className="flex items-start gap-3">
            <FileTypeIcon name={file.name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(null)}
                  className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {progress != null ? (
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                      style={{
                        width: `${Math.max(0, Math.min(100, progress))}%`,
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                    {Math.round(progress)} %
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FormOrDivider({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center py-1", className)}>
      <div className="h-px w-full bg-border" />
      <span className="absolute left-1/2 -translate-x-1/2 bg-background px-3 text-xs font-medium text-muted-foreground">
        or
      </span>
    </div>
  );
}

export type UrlImportFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onUpload?: () => void;
  uploading?: boolean;
  placeholder?: string;
  disabled?: boolean;
};

export function UrlImportField({
  label = "Import from URL",
  value,
  onChange,
  onUpload,
  uploading = false,
  placeholder = "Add file URL",
  disabled = false,
}: UrlImportFieldProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="flex h-11 items-stretch overflow-hidden rounded-xl border border-input bg-muted/30 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20 dark:bg-muted/20 dark:focus-within:ring-primary/20">
        <input
          type="url"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled || uploading || !value.trim()}
          onClick={() => onUpload?.()}
          className="m-1 shrink-0 rounded-lg border border-input bg-background px-3.5 text-sm font-semibold text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          {uploading ? "…" : "Upload"}
        </button>
      </div>
    </div>
  );
}
