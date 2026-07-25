import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/** Formats a date/time value into wall-clock local time (e.g., "10:00 AM") without browser timezone shifts. */
export function formatClinicTime(date: Date | string | number) {
  if (!date) return "";
  if (typeof date === "string") {
    // If it's an ISO string like "2026-07-25T10:00:00.000Z" or "10:00"
    if (date.length === 5 && date.includes(":")) {
      const [hStr, mStr] = date.split(":");
      let h = parseInt(hStr, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h}:${mStr} ${ampm}`;
    }
    
    // Extract HH:mm directly from ISO string "2026-07-25T10:00:00"
    const match = date.match(/T(\d{2}):(\d{2})/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2];
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    }
  }

  const d = new Date(date);
  let h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export function formatTime(date: Date | string | number) {
  return formatClinicTime(date);
}

export function getLocalDateString(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
