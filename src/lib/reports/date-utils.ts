import { startOfDay, endOfDay, parseISO, isValid } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";

/**
 * Validates and converts standard YYYY-MM-DD inputs into 
 * timezone-aware Start and End Date objects.
 */
export function getTimezoneAwareDateRange(
  startDateStr: string,
  endDateStr: string,
  timezone: string
): { start: Date; end: Date } {
  if (!startDateStr || !endDateStr) {
    throw new Error("startDate and endDate are required");
  }

  const parsedStart = parseISO(startDateStr);
  const parsedEnd = parseISO(endDateStr);

  if (!isValid(parsedStart) || !isValid(parsedEnd)) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }

  // Calculate the difference in days
  const daysDifference = (parsedEnd.getTime() - parsedStart.getTime()) / (1000 * 3600 * 24);
  if (daysDifference > 366) {
    throw new Error("Date range exceeds maximum allowed limit (1 year).");
  }

  if (daysDifference < 0) {
    throw new Error("startDate cannot be after endDate.");
  }

  try {
    // Determine start of day in the target timezone
    // e.g. "2024-01-01" in "America/New_York" -> "2024-01-01T00:00:00.000-05:00"
    const startTzStr = formatInTimeZone(parsedStart, timezone, "yyyy-MM-dd'T'00:00:00XXX");
    const endTzStr = formatInTimeZone(parsedEnd, timezone, "yyyy-MM-dd'T'23:59:59.999XXX");

    return {
      start: new Date(startTzStr),
      end: new Date(endTzStr),
    };
  } catch (error) {
    console.error("Timezone parsing error:", error);
    // Fallback if timezone is totally invalid
    return {
      start: startOfDay(parsedStart),
      end: endOfDay(parsedEnd),
    };
  }
}
