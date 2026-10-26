import { resolveClinicTimezone } from "@/lib/timezone";
import { parseTimeString, formatTimeObj } from "@/lib/operating-hours";

export interface TimeInterval {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  label?: string;
}

export interface DayScheduleRules {
  isClosed: boolean;
  inClinicIntervals: TimeInterval[];
  teleIntervals: TimeInterval[];
  rawText?: string;
}

export interface SlotValidationParams {
  appointmentDate: Date; // date object
  hour: number;          // 0-23
  minute: number;        // 0-59
  modality: "IN_CLINIC" | "TELE_CONSULTATION";
  clinicTimezone?: string | null;
  config?: {
    morningOpdHours?: string | null;
    morningOpd?: string | null;
    eveningOpdHours?: string | null;
    eveningOpd?: string | null;
    sundayRule?: string | null;
    clinicTimings?: string | null;
    allowTeleConsultation?: boolean;
    teleConsultationHours?: string | null;
  } | null;
  doctorInfo?: {
    workingHoursStart?: string | null;
    workingHoursEnd?: string | null;
    timezone?: string | null;
  } | null;
  practitioner?: {
    name?: string | null;
    workingDays?: string[];
    workingHoursStart?: string | null;
    workingHoursEnd?: string | null;
  } | null;
}

export interface SlotValidationResult {
  isValid: boolean;
  reason?: "CLOSED_ON_DAY" | "OUTSIDE_IN_CLINIC_HOURS" | "OUTSIDE_TELE_HOURS" | "OUTSIDE_PRACTITIONER_SHIFT" | "OUTSIDE_PRACTITIONER_DAY";
  dayOfWeek: string; // e.g. "SUNDAY", "MONDAY"
  formattedSlotTime: string; // e.g. "5:00 PM"
  availableInClinicHours?: string;
  availableTeleHours?: string;
  correctiveMessage?: string;
}

/**
 * Extracts all time intervals from a schedule string like:
 * "10:00 AM - 1:30 PM & 5:00 PM - 8:30 PM" or "Morning 10:00 AM - 12:00 PM"
 */
export function extractTimeIntervals(text: string): TimeInterval[] {
  if (!text || typeof text !== "string") return [];
  const intervals: TimeInterval[] = [];

  // Match patterns like "10:00 AM - 1:30 PM" or "10am-1pm" or "17:00 - 19:30"
  const rangeRegex = /(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*(?:-|to|–|till)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/gi;
  let match: RegExpExecArray | null;

  while ((match = rangeRegex.exec(text)) !== null) {
    const startParsed = parseTimeString(match[1]);
    const endParsed = parseTimeString(match[2]);

    if (startParsed && endParsed) {
      intervals.push({
        startHour: startParsed.hours,
        startMinute: startParsed.minutes,
        endHour: endParsed.hours,
        endMinute: endParsed.minutes,
        label: `${match[1].trim()} - ${match[2].trim()}`
      });
    }
  }

  return intervals;
}

/**
 * Checks if a specific (hour, minute) falls within any of the intervals
 */
export function isTimeInIntervals(hour: number, minute: number, intervals: TimeInterval[]): boolean {
  if (intervals.length === 0) return false;
  const timeInMinutes = hour * 60 + minute;

  return intervals.some((interval) => {
    const startTotal = interval.startHour * 60 + interval.startMinute;
    let endTotal = interval.endHour * 60 + interval.endMinute;
    // Allow up to 15 minute grace buffer at closing
    return timeInMinutes >= startTotal && timeInMinutes <= (endTotal + 15);
  });
}

/**
 * Parses Sunday specific rules which often combine In-Clinic and Online timings:
 * e.g. "In-clinic 10:00 AM - 12:00 PM & Online consult 10:00 AM - 8:00 PM" or "Closed" or "10:00 AM - 1:00 PM"
 */
export function parseSundaySchedule(sundayRuleStr?: string | null): DayScheduleRules {
  if (!sundayRuleStr || typeof sundayRuleStr !== "string" || /closed|none|na|n\/a|off/i.test(sundayRuleStr.trim())) {
    return {
      isClosed: true,
      inClinicIntervals: [],
      teleIntervals: [],
      rawText: sundayRuleStr || "Closed"
    };
  }

  const raw = sundayRuleStr.trim();
  const lower = raw.toLowerCase();

  let inClinicText = "";
  let teleText = "";

  // Check if partitioned by "In-clinic" and "Online"
  if (lower.includes("in-clinic") || lower.includes("in clinic") || lower.includes("online") || lower.includes("tele")) {
    const inClinicMatch = raw.match(/in-?clinic\s*(?:opd|consult(?:ation)?)?\s*([^&|;]+)/i);
    const onlineMatch = raw.match(/(?:online|tele)(?:\s*consult(?:ation)?)?\s*([^&|;]+)/i);

    if (inClinicMatch) inClinicText = inClinicMatch[1];
    if (onlineMatch) teleText = onlineMatch[1];
  } else {
    // Standard unpartitioned Sunday timing: applies to in-clinic
    inClinicText = raw;
  }

  const inClinicIntervals = extractTimeIntervals(inClinicText);
  const teleIntervals = extractTimeIntervals(teleText);

  return {
    isClosed: inClinicIntervals.length === 0 && teleIntervals.length === 0,
    inClinicIntervals,
    teleIntervals,
    rawText: raw
  };
}

/**
 * Validates whether an appointment slot complies with the clinic and doctor's actual operational schedule.
 */
export function validateAppointmentSlot(params: SlotValidationParams): SlotValidationResult {
  const { appointmentDate, hour, minute, modality, config, doctorInfo, practitioner } = params;
  const clinicTz = resolveClinicTimezone(params.clinicTimezone || doctorInfo?.timezone);

  const dayOfWeek = appointmentDate.toLocaleDateString("en-US", { timeZone: clinicTz, weekday: "long" }).toUpperCase();
  const time12Str = formatTimeObj({ hours: hour, minutes: minute });

  // 1. Check Practitioner Working Days (if practitioner has explicit working days configured)
  if (practitioner && practitioner.workingDays && practitioner.workingDays.length > 0) {
    const validDaysUpper = practitioner.workingDays.map(d => d.toUpperCase());
    const isDayAllowed = validDaysUpper.some(d => d.includes(dayOfWeek) || dayOfWeek.includes(d));
    if (!isDayAllowed) {
      const allowedDaysList = practitioner.workingDays.join(", ");
      return {
        isValid: false,
        reason: "OUTSIDE_PRACTITIONER_DAY",
        dayOfWeek,
        formattedSlotTime: time12Str,
        correctiveMessage: `${practitioner.name || "Doctor"} ${dayOfWeek.toLowerCase()} ko consultations conduct nahi karte. Unke available days hain: *${allowedDaysList}*. Kripya in dino me se koi slot chunein. 🙏`
      };
    }
  }

  // 2. SUNDAY VALIDATION
  if (dayOfWeek === "SUNDAY") {
    const sundayRules = parseSundaySchedule(config?.sundayRule);

    if (sundayRules.isClosed) {
      return {
        isValid: false,
        reason: "CLOSED_ON_DAY",
        dayOfWeek,
        formattedSlotTime: time12Str,
        correctiveMessage: `Clinic Sundays ko closed rehta hai. Hum aapka appointment *Monday* ke liye schedule kar sakte hain. Kripya apna preferred Monday time batayein! 🙏`
      };
    }

    if (modality === "IN_CLINIC") {
      if (sundayRules.inClinicIntervals.length === 0) {
        // Sunday has no in-clinic hours at all
        const teleAvail = sundayRules.teleIntervals.length > 0
          ? `Sundays ko keval *Online Tele-Consultation* uplabdh hai (${sundayRules.teleIntervals.map(i => i.label).join(" & ")}).`
          : `Sundays ko clinic closed rehta hai.`;
        return {
          isValid: false,
          reason: "OUTSIDE_IN_CLINIC_HOURS",
          dayOfWeek,
          formattedSlotTime: time12Str,
          availableTeleHours: sundayRules.teleIntervals.map(i => i.label).join(" & "),
          correctiveMessage: `${teleAvail} Kya aap Sunday ko video consultation lena chahenge ya Monday ke liye clinic visit book karein? 🙏`
        };
      }

      const isWithinSundayClinic = isTimeInIntervals(hour, minute, sundayRules.inClinicIntervals);
      if (!isWithinSundayClinic) {
        const inClinicHoursLabel = sundayRules.inClinicIntervals.map(i => i.label).join(" & ");
        const hasTele = sundayRules.teleIntervals.length > 0;
        const teleHoursLabel = sundayRules.teleIntervals.map(i => i.label).join(" & ");

        const teleNote = hasTele && isTimeInIntervals(hour, minute, sundayRules.teleIntervals)
          ? ` Lekin ${time12Str} par hamara *Online Video Consultation* uplabdh hai.`
          : "";

        return {
          isValid: false,
          reason: "OUTSIDE_IN_CLINIC_HOURS",
          dayOfWeek,
          formattedSlotTime: time12Str,
          availableInClinicHours: inClinicHoursLabel,
          availableTeleHours: teleHoursLabel,
          correctiveMessage: `Sundays ko in-clinic consultations keval *${inClinicHoursLabel}* tak uplabdh hain.${teleNote} Kya aap ${hasTele ? `Online Consult lena chahenge ya ` : ""}Monday ke liye in-clinic visit schedule karein? 🙏`
        };
      }
    } else if (modality === "TELE_CONSULTATION") {
      if (sundayRules.teleIntervals.length > 0) {
        const isWithinTele = isTimeInIntervals(hour, minute, sundayRules.teleIntervals);
        if (!isWithinTele) {
          const teleHoursLabel = sundayRules.teleIntervals.map(i => i.label).join(" & ");
          return {
            isValid: false,
            reason: "OUTSIDE_TELE_HOURS",
            dayOfWeek,
            formattedSlotTime: time12Str,
            availableTeleHours: teleHoursLabel,
            correctiveMessage: `Sundays ko Online Video Consultations keval *${teleHoursLabel}* tak uplabdh hain. Kripya is samay ke beech ka slot batayein. 🙏`
          };
        }
      }
    }

    return {
      isValid: true,
      dayOfWeek,
      formattedSlotTime: time12Str
    };
  }

  // 3. WEEKDAY (MONDAY - SATURDAY) VALIDATION
  const morningIntervals = extractTimeIntervals(config?.morningOpdHours || config?.morningOpd || doctorInfo?.workingHoursStart || "");
  const eveningIntervals = extractTimeIntervals(config?.eveningOpdHours || config?.eveningOpd || doctorInfo?.workingHoursEnd || "");
  const weekdayIntervals = [...morningIntervals, ...eveningIntervals];

  // If weekday intervals are configured, verify the slot falls within active OPD hours
  if (weekdayIntervals.length > 0) {
    const isWithinWeekday = isTimeInIntervals(hour, minute, weekdayIntervals);
    if (!isWithinWeekday) {
      // If practitioner has distinct shift, verify that as well
      if (practitioner?.workingHoursStart && practitioner?.workingHoursEnd) {
        const pIntervals = extractTimeIntervals(`${practitioner.workingHoursStart} - ${practitioner.workingHoursEnd}`);
        if (pIntervals.length > 0 && isTimeInIntervals(hour, minute, pIntervals)) {
          return { isValid: true, dayOfWeek, formattedSlotTime: time12Str };
        }
      }

      const activeTimingsLabels = weekdayIntervals.map(i => i.label).join(" & ");
      return {
        isValid: false,
        reason: "OUTSIDE_IN_CLINIC_HOURS",
        dayOfWeek,
        formattedSlotTime: time12Str,
        availableInClinicHours: activeTimingsLabels,
        correctiveMessage: `Doctor clinic me *${activeTimingsLabels}* uplabdh rehte hain. ${time12Str} OPD hours ke bahar hai. Kripya morning ya evening OPD timings ke dauran ka samay batayein. 🙏`
      };
    }
  }

  return {
    isValid: true,
    dayOfWeek,
    formattedSlotTime: time12Str
  };
}
