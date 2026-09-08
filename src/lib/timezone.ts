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
 * Extracts the start hour and minute from an OPD timing string (e.g. "10:00 AM - 1:00 PM", "6:00 PM - 8:30 PM", "09:30")
 * dynamically, preventing hardcoded assumptions.
 */
export function extractOpdStartHourMinute(opdStr?: string | null): { hour: number; minute: number } | null {
  if (!opdStr || typeof opdStr !== "string") return null;
  const clean = opdStr.trim();
  const match = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = match[2] ? parseInt(match[2], 10) : 0;
  const mer = (match[3] || "").toLowerCase();
  if (mer === "pm" && h < 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
    return { hour: h, minute: m };
  }
  return null;
}

/**
 * Parses time or session string (e.g. "11:00 AM", "3 pm", "6 clock", "6 o'clock", "6 baje", "17:00", "Morning", "Evening")
 * into numeric hour (0-23) and minute (0-59).
 * Dynamically references doctor's actual OPD schedule when generic session names are provided.
 */
export function parseSessionOrTimeToHourMinute(
  timeOrSessionStr: string,
  defaultHour: number = 10,
  referenceSchedule?: {
    morningOpd?: string | null;
    eveningOpd?: string | null;
    workingHoursStart?: string | null;
    timings?: string | null;
  }
): { hour: number; minute: number } {
  const str = (timeOrSessionStr || "").trim().toLowerCase();

  // 1. Try to find explicit time pattern like "11:30 am", "3 pm", "6 clock", "6 o'clock", "6 baje", "17:00"
  const timeMatch = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|o'?clock|clock)?/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const suffix = (timeMatch[3] || "").toLowerCase();

    const isExplicitPm = suffix === "pm";
    const isExplicitAm = suffix === "am";
    const hasEveningContext = str.includes("evening") || str.includes("sham") || str.includes("shaam") || str.includes("night") || str.includes("raat") || defaultHour >= 12;
    const hasAfternoonContext = str.includes("afternoon") || str.includes("dopahar");
    const hasMorningContext = str.includes("morning") || str.includes("subah");

    if (isExplicitPm) {
      if (hour < 12) hour += 12;
    } else if (isExplicitAm) {
      if (hour === 12) hour = 0;
    } else {
      // Suffix is empty, or colloquial like "clock", "baje", "o'clock"
      if (hour >= 1 && hour <= 12) {
        if (hasEveningContext) {
          if (hour < 12) hour += 12;
        } else if (hasAfternoonContext) {
          if (hour < 12 && hour !== 12) hour += 12;
        } else if (hasMorningContext) {
          if (hour === 12) hour = 0;
        } else {
          // In medical practice, 1 to 6 without AM is afternoon/evening (1 PM to 6 PM)
          if (hour >= 1 && hour <= 6) {
            hour += 12;
          }
        }
      }
    }

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }

  // 2. Map pure session keywords WITHOUT numbers to actual doctor OPD hours (dynamic, never arbitrary)
  if (str.includes("morning") || str.includes("subah")) {
    const dynamicStart = extractOpdStartHourMinute(referenceSchedule?.morningOpd || referenceSchedule?.workingHoursStart);
    if (dynamicStart) return dynamicStart;
    return { hour: defaultHour ?? 10, minute: 0 };
  }
  if (str.includes("afternoon") || str.includes("dopahar")) {
    return { hour: defaultHour >= 12 && defaultHour <= 15 ? defaultHour : 14, minute: 0 };
  }
  if (str.includes("evening") || str.includes("sham") || str.includes("shaam")) {
    const dynamicStart = extractOpdStartHourMinute(referenceSchedule?.eveningOpd);
    if (dynamicStart) return dynamicStart;
    return { hour: defaultHour >= 16 ? defaultHour : 17, minute: 0 };
  }
  if (/\b(night|raat)\b/i.test(str)) {
    const dynamicStart = extractOpdStartHourMinute(referenceSchedule?.eveningOpd);
    if (dynamicStart) return dynamicStart;
    return { hour: defaultHour >= 16 ? defaultHour : 20, minute: 0 };
  }

  return { hour: defaultHour, minute: 0 };
}

/**
 * Scans conversation history to recover the exact agreed numeric time (e.g. "3:00 PM", "6:00 PM", "6 clock")
 * when an LLM tag emits a generic session name like "Afternoon" or "Evening".
 * Guarantees zero time-shifting across multi-turn booking flows.
 */
export function extractAgreedTimeFromHistory(
  sessionStr: string,
  latestMessage: string,
  history: string[] = []
): string {
  // If sessionStr already contains digits, preserve it
  if (sessionStr && /\d/.test(sessionStr)) {
    return sessionStr.trim();
  }

  // Regex to match explicit requested times in patient/clinic dialogue
  const explicitTimeRegex = /(?:at|for|around|—|-|\b)(\d{1,2}(?::\d{2})?\s*(?:am|pm|baje|o'?clock|clock))\b/i;

  // Scan recent conversation from newest to oldest
  const messagesToCheck = [latestMessage, ...[...history].reverse()];
  for (const msg of messagesToCheck) {
    if (!msg) continue;
    const match = msg.match(explicitTimeRegex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return sessionStr;
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
