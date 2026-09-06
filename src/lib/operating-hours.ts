/**
 * Utility for parsing, formatting, and converting Google Business Profile & Google Maps
 * operating hours between API objects (periods, weekday_text) and human-readable representations.
 */

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

/**
 * Format a time object { hours: 9, minutes: 0 } into "9:00 AM"
 */
export function formatTimeObj(time?: { hours?: number; minutes?: number } | null): string {
  if (!time || time.hours === undefined || time.hours === null) return "";
  const h = Number(time.hours);
  const m = Number(time.minutes || 0);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : `${m}`;
  return `${displayH}:${displayM} ${ampm}`;
}

/**
 * Parse a human time string like "9:00 AM", "18:00", "5:30 PM", "9AM" into { hours, minutes }
 */
export function parseTimeString(tStr: string): { hours: number; minutes: number } | null {
  if (!tStr) return null;
  const clean = tStr.trim().toUpperCase();
  const match = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3];

  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;

  return { hours: Math.min(23, Math.max(0, h)), minutes: Math.min(59, Math.max(0, m)) };
}

/**
 * Helper to group matching day schedules together, e.g.
 * Mon-Sat: 9:00 AM – 6:00 PM, Sun: Closed
 */
function groupDayTimes(dayTimes: { day: string; time: string }[]): string {
  if (dayTimes.length === 0) return "Not specified";

  // Check if Mon-Sat are identical
  const monToSat = dayTimes.slice(0, 6);
  const sun = dayTimes[6];
  const allMonToSatSame = monToSat.length === 6 && monToSat.every((d) => d.time === monToSat[0].time && d.time !== "Closed");

  if (allMonToSatSame) {
    const timing = monToSat[0].time;
    if (!sun || sun.time === "Closed") {
      return `Mon–Sat: ${timing} (Sun: Closed)`;
    }
    return `Mon–Sat: ${timing}, Sun: ${sun.time}`;
  }

  // Check if Mon-Fri are identical
  const monToFri = dayTimes.slice(0, 5);
  const sat = dayTimes[5];
  const allMonToFriSame = monToFri.length === 5 && monToFri.every((d) => d.time === monToFri[0].time && d.time !== "Closed");

  if (allMonToFriSame) {
    const timing = monToFri[0].time;
    const weekendParts = [];
    if (sat && sat.time !== "Closed") weekendParts.push(`Sat: ${sat.time}`);
    if (sun && sun.time !== "Closed") weekendParts.push(`Sun: ${sun.time}`);
    else weekendParts.push("Sun: Closed");
    return `Mon–Fri: ${timing}, ${weekendParts.join(", ")}`;
  }

  // Check if all 7 days are identical
  const allDaysSame = dayTimes.every((d) => d.time === dayTimes[0].time);
  if (allDaysSame && dayTimes[0].time !== "Closed") {
    return `Daily: ${dayTimes[0].time}`;
  }

  // Otherwise list open days cleanly
  const openDays = dayTimes.filter((d) => d.time !== "Closed");
  if (openDays.length === 0) return "Temporarily Closed";

  return openDays.map((d) => `${d.day}: ${d.time}`).join(", ");
}

/**
 * Robustly format Google API operating hours into a clean, human-readable schedule.
 * Handles:
 * 1. Google Business Information API { periods: [...] }
 * 2. Google Places API { weekday_text: [...] } or { periods: [...] }
 * 3. Pre-formatted plain string
 * 4. Empty / null state (returns "Not specified", never fake hardcoded data)
 */
export function formatOperatingHours(hoursData: any): string {
  if (!hoursData) return "Not specified";

  // 1. If already a clean string
  if (typeof hoursData === "string") {
    const trimmed = hoursData.trim();
    if (!trimmed) return "Not specified";
    try {
      const parsedJson = JSON.parse(trimmed);
      if (typeof parsedJson === "object" && parsedJson !== null) {
        return formatOperatingHours(parsedJson);
      }
    } catch (_) {}
    return trimmed;
  }

  // 2. Google Places API: weekday_text array (e.g. ["Monday: 9:00 AM – 6:00 PM", ...])
  if (Array.isArray(hoursData.weekday_text) && hoursData.weekday_text.length > 0) {
    const lines = hoursData.weekday_text.map((l: string) => l.trim());
    
    // Group days with identical timings
    const dayTimes = lines.map((line: string) => {
      const parts = line.split(/:\s*/);
      return {
        day: parts[0]?.trim() || "",
        time: parts[1]?.trim() || "Closed"
      };
    });

    return groupDayTimes(dayTimes);
  }

  // 3. Google Business Profile API: periods array
  const periods = Array.isArray(hoursData.periods) 
    ? hoursData.periods 
    : Array.isArray(hoursData) 
    ? hoursData 
    : null;

  if (periods && periods.length > 0) {
    // Map periods into daily times
    const dailyMap: Record<string, string[]> = {};
    for (const d of DAY_ORDER) {
      dailyMap[d] = [];
    }

    for (const p of periods) {
      const day = (p.openDay || p.day || "").toUpperCase();
      if (!day) continue;

      const openStr = p.openTime ? formatTimeObj(p.openTime) : p.open ? formatTimeObj(p.open.time ? { hours: parseInt(p.open.time.slice(0, 2), 10), minutes: parseInt(p.open.time.slice(2), 10) } : p.open) : "";
      const closeStr = p.closeTime ? formatTimeObj(p.closeTime) : p.close ? formatTimeObj(p.close.time ? { hours: parseInt(p.close.time.slice(0, 2), 10), minutes: parseInt(p.close.time.slice(2), 10) } : p.close) : "";

      if (openStr && closeStr) {
        if (!dailyMap[day]) dailyMap[day] = [];
        dailyMap[day].push(`${openStr} – ${closeStr}`);
      } else if (openStr && !closeStr) {
        if (!dailyMap[day]) dailyMap[day] = [];
        dailyMap[day].push(`${openStr} onwards`);
      }
    }

    const dayTimes = DAY_ORDER.map((day) => ({
      day: DAY_SHORT[day],
      time: dailyMap[day].length > 0 ? dailyMap[day].join(", ") : "Closed",
    }));

    return groupDayTimes(dayTimes);
  }

  return "Not specified";
}

/**
 * Convert a user-provided schedule string (e.g. "Mon-Sat 9:00 AM - 6:00 PM")
 * into Google Business Information API regularHours.periods array
 */
export function convertToGoogleRegularHours(scheduleInput: any): { periods: any[] } {
  if (scheduleInput && typeof scheduleInput === "object" && Array.isArray(scheduleInput.periods)) {
    return scheduleInput;
  }

  const str = String(scheduleInput || "").trim();
  if (!str || str.toLowerCase() === "closed") {
    return { periods: [] };
  }

  // Check 24/7
  if (str.toLowerCase().includes("24/7") || str.toLowerCase().includes("24 hours")) {
    return {
      periods: DAY_ORDER.map((day) => ({
        openDay: day,
        openTime: { hours: 0, minutes: 0 },
        closeDay: day,
        closeTime: { hours: 23, minutes: 59 },
      })),
    };
  }

  // Match time ranges: e.g. "9:00 AM - 6:00 PM" or "9AM-6PM" or "10:00 - 19:00"
  const timeRangeMatch = str.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i);
  if (!timeRangeMatch) {
    return { periods: [] };
  }

  const openParsed = parseTimeString(timeRangeMatch[1]) || { hours: 9, minutes: 0 };
  const closeParsed = parseTimeString(timeRangeMatch[2]) || { hours: 18, minutes: 0 };

  // Determine which days apply
  const lower = str.toLowerCase();
  let targetDays: readonly string[] = DAY_ORDER;

  if (lower.includes("mon-fri") || lower.includes("mon to fri") || lower.includes("weekdays")) {
    targetDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  } else if (lower.includes("mon-sat") || lower.includes("mon to sat")) {
    targetDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  } else if (lower.includes("daily") || lower.includes("all days") || lower.includes("mon-sun")) {
    targetDays = DAY_ORDER;
  }

  const periods = targetDays.map((day) => ({
    openDay: day,
    openTime: { hours: openParsed.hours, minutes: openParsed.minutes },
    closeDay: day,
    closeTime: { hours: closeParsed.hours, minutes: closeParsed.minutes },
  }));

  return { periods };
}
