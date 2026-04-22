import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(dob: string | Date): number {
  const birthDate = typeof dob === "string" ? new Date(dob) : dob;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateISO(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

// Today's date as YYYY-MM-DD in the *local* timezone. Use this for form
// defaults — `new Date().toISOString()` returns UTC and silently shifts the
// date by one day for users west of UTC late in the day.
export function todayLocalISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

// Server-side "today" in UTC. Used as a lenient upper bound for date
// validation in server actions; clients are already guarded by browser
// `max` attributes + the stricter local check.
export function todayUTCISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatRelativeDays(date: string | Date): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfValue = new Date(value);
  startOfValue.setHours(0, 0, 0, 0);

  const diffMs = startOfToday.getTime() - startOfValue.getTime();
  const days = Math.floor(diffMs / 86400000);

  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 14) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 24) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
