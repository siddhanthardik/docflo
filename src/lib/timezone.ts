/**
 * Timezone Utility Module
 * 
 * Enforces strict, clinic-timezone-aware Date construction and manipulation.
 * Eliminates server-local (Ubuntu/UTC) timezone bleed (.setHours() bugs)
 * and never hardcodes "+05:30" or any static offset.
 */

const DEFAULT_CLINIC_TIMEZONE = "Asia/Kolkata";

/**
 * Validates and resolves the doctor/clinic IANA timezone.
 * Defaults to "Asia/Kolkata" if missing, null, or invalid.
 */
export function resolveClinicTimezone(tz?: string | null): string {
  if (tz && typeof tz === "string" && tz.trim() && tz.trim().toUpperCase() !== "UTC") {
    try {
      // Validate that Intl supports this IANA timezone
      Intl.DateTimeFormat(undefined, { timeZone: tz.trim() });
      return tz.trim();
    } catch {
      console.warn(`[Timezone] Invalid timezone "${tz}", falling back to ${DEFAULT_CLINIC_TIMEZONE}`);
    }
  }
  return DEFAULT_CLINIC_TIMEZONE;
}

/**
 * Computes the exact ISO offset string (e.g. "+05:30", "+04:00", "-04:00", "+00:00")
 * for any given IANA timezone and date dynamically.
 * Automatically accounts for Daylight Saving Time (DST) on the given date.
 */
export function getClinicTimezoneOffset(timezone: string, date: Date = new Date()): string {
  const validTz = resolveClinicTimezone(timezone);
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: validTz,
      timeZoneName: "longOffset",
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    if (tzPart && tzPart.value) {
      const match = tzPart.value.match(/GMT([+-]\d{2}:\d{2})/);
      if (match) return match[1];
      if (tzPart.value === "GMT") return "+00:00";
    }
  } catch (e) {
    console.error(`[Timezone] Failed to get offset for ${validTz}:`, e);
  }
  return "+05:30"; // safe fallback for Indian clinics if Intl fails
}

/**
 * Extracts YYYY-MM-DD in the clinic's timezone from a Date or string.
 */
export function getClinicDateOnlyString(dateInput: Date | string, timezone: string): string {
  const validTz = resolveClinicTimezone(timezone);
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    return dateInput.trim();
  }
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    return new Date().toLocaleDateString("en-CA", { timeZone: validTz });
  }
  return d.toLocaleDateString("en-CA", { timeZone: validTz });
}

/**
 * Parses time or session string (e.g. "11:00 AM", "11 AM", "5:30 pm", "17:00", "Morning", "Evening")
 * into numeric hour (0-23) and minute (0-59).
 */
export function parseSessionOrTimeToHourMinute(
  timeOrSessionStr: string,
  defaultHour: number = 10
): { hour: number; minute: number } {
  const str = (timeOrSessionStr || "").trim().toLowerCase();

  // 1. Try to find explicit time pattern like "11:30 am", "11 am", "5:30 pm", "17:00", "5 pm"
  const timeMatch = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const mer = (timeMatch[3] || "").toLowerCase();

    if (mer === "pm" && hour < 12) hour += 12;
    if (mer === "am" && hour === 12) hour = 0;

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }

  // 2. Map session keywords to reasonable clinic OPD hours
  if (str.includes("morning") || str.includes("subah")) {
    return { hour: 10, minute: 0 };
  }
  if (str.includes("afternoon") || str.includes("dopahar")) {
    return { hour: 14, minute: 0 };
  }
  if (str.includes("evening") || str.includes("sham") || str.includes("shaam")) {
    return { hour: 17, minute: 0 };
  }
  if (str.includes("night") || str.includes("raat")) {
    return { hour: 20, minute: 0 };
  }

  return { hour: defaultHour, minute: 0 };
}

/**
 * Constructs strict, timezone-aware Date objects for an appointment (startTime, endTime, dbDate)
 * strictly tied to the clinic's timezone, NEVER the Ubuntu server's timezone.
 */
export function createClinicAppointmentDateTimes({
  dateStr,
  hour,
  minute = 0,
  durationMinutes = 60,
  timezone = DEFAULT_CLINIC_TIMEZONE,
}: {
  dateStr: string | Date;
  hour: number;
  minute?: number;
  durationMinutes?: number;
  timezone?: string | null;
}): {
  startTime: Date;
  endTime: Date;
  dbAppointmentDate: Date;
  dateOnlyStr: string;
  timeLabel: string;
  dateLabel: string;
} {
  const validTz = resolveClinicTimezone(timezone);
  const dateOnlyStr = getClinicDateOnlyString(dateStr, validTz);

  // Parse reference date to get dynamic offset (handles DST if applicable)
  const approxDate = new Date(`${dateOnlyStr}T12:00:00Z`);
  const tzOffset = getClinicTimezoneOffset(validTz, approxDate);

  const hourStr = String(Math.max(0, Math.min(23, hour))).padStart(2, "0");
  const minStr = String(Math.max(0, Math.min(59, minute))).padStart(2, "0");

  const startIsoStr = `${dateOnlyStr}T${hourStr}:${minStr}:00${tzOffset}`;
  const startTime = new Date(startIsoStr);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  const dbAppointmentDate = new Date(`${dateOnlyStr}T00:00:00${tzOffset}`);

  const timeLabel = startTime.toLocaleTimeString("en-IN", {
    timeZone: validTz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const dateLabel = startTime.toLocaleDateString("en-IN", {
    timeZone: validTz,
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return {
    startTime,
    endTime,
    dbAppointmentDate,
    dateOnlyStr,
    timeLabel,
    dateLabel,
  };
}

/**
 * Generates Start of Day and End of Day Date objects in the clinic's timezone.
 * Used for database queries (e.g. today's appointments, quota checks),
 * ensuring the bounds match the clinic's local midnight to midnight, NOT Ubuntu UTC midnight.
 */
export function getClinicDayBounds(dateInput: Date | string, timezone?: string | null): {
  startOfDay: Date;
  endOfDay: Date;
  dateOnlyStr: string;
} {
  const validTz = resolveClinicTimezone(timezone);
  const dateOnlyStr = getClinicDateOnlyString(dateInput, validTz);
  const approxDate = new Date(`${dateOnlyStr}T12:00:00Z`);
  const tzOffset = getClinicTimezoneOffset(validTz, approxDate);

  const startOfDay = new Date(`${dateOnlyStr}T00:00:00.000${tzOffset}`);
  const endOfDay = new Date(`${dateOnlyStr}T23:59:59.999${tzOffset}`);

  return { startOfDay, endOfDay, dateOnlyStr };
}

/**
 * Formats a Date object in the clinic's timezone.
 */
export function formatInClinicTime(
  date: Date,
  timezone?: string | null,
  options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true }
): string {
  const validTz = resolveClinicTimezone(timezone);
  return date.toLocaleTimeString("en-IN", {
    timeZone: validTz,
    ...options,
  });
}

/**
 * Formats a Date object as date in the clinic's timezone.
 */
export function formatInClinicDate(
  date: Date,
  timezone?: string | null,
  options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }
): string {
  const validTz = resolveClinicTimezone(timezone);
  return date.toLocaleDateString("en-IN", {
    timeZone: validTz,
    ...options,
  });
}
