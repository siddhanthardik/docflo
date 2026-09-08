import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number, timeZone: string = "Asia/Kolkata") {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/** Formats a date/time value into local clinic time (e.g., "12:30 PM"). */
export function formatClinicTime(date: Date | string | number, timeZone: string = "Asia/Kolkata") {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatTime(date: Date | string | number, timeZone: string = "Asia/Kolkata") {
  return formatClinicTime(date, timeZone);
}

export function getLocalDateString(date: Date | string = new Date(), timeZone: string = "Asia/Kolkata"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(d);
}

/** Formats a doctor display name cleanly with proper Dr. prefix */
export function formatDoctorDisplayName(rawName?: string): string {
  if (!rawName || rawName.trim() === "" || rawName.toLowerCase() === "doctor") {
    return "the Doctor";
  }
  let clean = rawName.trim();
  while (/^(dr\.?|doctor)\s+/i.test(clean)) {
    clean = clean.replace(/^(dr\.?|doctor)\s+/i, "").trim();
  }
  return clean ? `Dr. ${clean}` : "the Doctor";
}
