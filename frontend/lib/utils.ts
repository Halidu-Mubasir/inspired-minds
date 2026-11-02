import { clsx, type ClassValue } from "clsx";
import { format, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// parseISO reads a date-only "YYYY-MM-DD" as local midnight, unlike `new Date()` (UTC).
function toDate(date: string | Date): Date {
  return typeof date === "string" ? parseISO(date) : date;
}

/** e.g. "05 Mar 2026" */
export function formatDate(date: string | Date): string {
  return format(toDate(date), "dd MMM yyyy");
}

/** e.g. "Thursday, 5 March 2026" */
export function formatLongDate(date: string | Date): string {
  return format(toDate(date), "EEEE, d MMMM yyyy");
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
