"use client";

import { Check, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CheckListEditorProps = {
  id: string;
  title: string;
  hint?: string;
  addLabel: string;
  placeholder?: string;
  items: string[];
  onChange: (items: string[]) => void;
  readOnly?: boolean;
  optional?: boolean;
  max?: number;
};

/** Add outcomes/requirements with ✓ preview list. */
export function CheckListEditor({
  id,
  title,
  hint,
  addLabel,
  placeholder,
  items,
  onChange,
  readOnly = false,
  optional = false,
  max = 30,
}: CheckListEditorProps) {
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

  return (
    <div className="card-soft space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-brand-navy dark:text-foreground">
          {title}
          {optional ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              (optional)
            </span>
          ) : null}
        </h2>
        {hint ? (
          <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
        ) : null}
      </div>

      {!readOnly ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={id}
            value={value}
            placeholder={placeholder}
            maxLength={240}
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
            disabled={!value.trim() || full}
            onClick={add}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing added yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className={cn(
                "flex items-start gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm",
              )}
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-lime" />
              <span className="min-w-0 flex-1 break-words text-foreground">
                {item}
              </span>
              {!readOnly ? (
                <button
                  type="button"
                  aria-label={`Remove ${item}`}
                  onClick={() =>
                    onChange(items.filter((_, i) => i !== index))
                  }
                  className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
