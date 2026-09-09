"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ListEditorProps = {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  items: string[];
  onChange: (items: string[]) => void;
  readOnly?: boolean;
  max?: number;
  variant?: "rows" | "tags";
};

export function ListEditor({
  id,
  label,
  hint,
  placeholder,
  items,
  onChange,
  readOnly = false,
  max = 30,
  variant = "rows",
}: ListEditorProps) {
  const [value, setValue] = useState("");
  const full = items.length >= max;

  function add() {
    const next = value.trim();
    if (!next || full) return;
    if (items.some((i) => i.toLowerCase() === next.toLowerCase())) {
      setValue("");
      return;
    }
    onChange([...items, next]);
    setValue("");
  }

  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs text-muted-foreground">
          {items.length}/{max}
        </span>
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}

      {!readOnly ? (
        <div className="flex gap-2">
          <Input
            id={id}
            value={value}
            placeholder={placeholder}
            maxLength={variant === "tags" ? 40 : 240}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Add ${label}`}
            disabled={!value.trim() || full}
            onClick={add}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing added yet.</p>
      ) : variant === "tags" ? (
        <ul className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-navy/5 px-3 py-1.5 text-xs font-medium text-brand-navy dark:bg-brand-lime/10 dark:text-brand-lime"
            >
              {item}
              {!readOnly ? (
                <button
                  type="button"
                  aria-label={`Remove ${item}`}
                  onClick={() => removeAt(index)}
                  className="rounded-full p-0.5 hover:bg-brand-navy/10"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className={cn(
                "flex items-start gap-2 rounded-2xl border border-border/70 px-3 py-2 text-sm",
              )}
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-lime" />
              <span className="min-w-0 flex-1 break-words">{item}</span>
              {!readOnly ? (
                <span className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="rounded-full p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                    className="rounded-full p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${item}`}
                    onClick={() => removeAt(index)}
                    className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
