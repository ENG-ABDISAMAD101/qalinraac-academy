import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function greetingForHour(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

/** First + second name parts for greetings (e.g. Abdirisak Mohamed). */
export function displayStudentName(fullName?: string | null) {
  if (!fullName?.trim()) return "Student";
  const parts = fullName.trim().split(/\s+/);
  return parts.slice(0, 2).join(" ");
}

export function initialsFromName(fullName?: string | null) {
  if (!fullName?.trim()) return "ST";
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
