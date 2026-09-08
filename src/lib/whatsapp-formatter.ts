import { formatPatientSalutation, calculateAgeFromDob } from "./salutation";
import { formatDoctorDisplayName } from "./utils";
import { resolveClinicTimezone } from "./timezone";

export interface AppointmentCardParams {
  patient: {
    firstName?: string | null;
    lastName?: string | null;
    gender?: string | null;
    age?: number | null;
    dateOfBirth?: Date | string | null;
  };
  doctorName?: string | null;
  specialty?: string | null;
  clinicName?: string | null;
  startTime: Date;
  clinicTz?: string | null;
  consultationFee?: number | string | null;
  isTele?: boolean;
  address?: string | null;
  city?: string | null;
  mapsUrl?: string | null;
  customNotes?: string | null;
}

/**
 * Formats a WhatsApp appointment confirmation card matching the Gyrex clinical design.
 * Reference: media_1788722108402.png
 */
export function formatAppointmentConfirmationCard(params: AppointmentCardParams): string {
  const {
    patient,
    doctorName,
    specialty = "Medical Specialist",
    clinicName = "Clinic",
    startTime,
    consultationFee,
    isTele = false,
    address,
    city,
    mapsUrl,
  } = params;
  const clinicTz = resolveClinicTimezone(params.clinicTz);

  // 1. Resolve Patient Salutation & Age
  const salutationResult = formatPatientSalutation(patient);
  const calculatedAge = patient.age ?? calculateAgeFromDob(patient.dateOfBirth);
  const ageString = calculatedAge !== null && calculatedAge !== undefined 
    ? (calculatedAge < 1 ? " (Infant)" : ` (Age ${calculatedAge})`) 
    : "";
  
  const patientDisplay = `*${salutationResult.fullNameWithSalutation}${ageString}*`;

  // 2. Explicit Exact Date & Time Display (Always unambiguous: e.g. "Sunday, 6 September 2026 • 05:00 PM")
  const fullDateFormatted = startTime.toLocaleDateString("en-IN", {
    timeZone: clinicTz,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const timeFormatted = startTime.toLocaleTimeString("en-IN", {
    timeZone: clinicTz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  const exactDateTime = `${fullDateFormatted} • ${timeFormatted}`;

  // 3. Doctor and Clinic
  const formattedDoctor = formatDoctorDisplayName(doctorName || "Doctor");
  const cleanClinic = (clinicName || "Clinic").trim();
  const cleanSpecialty = (specialty || "Specialist").trim();

  // 4. Payment / Fee line
  let paymentLine = "";
  if (isTele) {
    paymentLine = "Payment: *Tele-Consultation (Online link will be shared prior to consultation)*";
  } else if (consultationFee && Number(consultationFee) > 0) {
    paymentLine = `Payment: *₹${Number(consultationFee).toLocaleString("en-IN")} (Pay at Clinic)*`;
  } else {
    paymentLine = "Payment: *Pay at Clinic*";
  }

  // 5. Location details (Only for in-clinic visits)
  let locationBlock = "";
  if (!isTele) {
    const locationParts = [address, city].filter(Boolean).map(s => s?.trim()).filter(Boolean);
    const fullAddress = locationParts.join(", ");
    if (fullAddress || mapsUrl) {
      locationBlock = `\n\n📍 *Clinic Address:*\n${fullAddress || cleanClinic}`;
      if (mapsUrl && mapsUrl.startsWith("http")) {
        locationBlock += `\n🧭 *Get Directions:* ${mapsUrl}`;
      }
    }
  }

  return (
`✓ *APPOINTMENT CONFIRMED*
────────────────────────────
*${exactDateTime}*
────────────────────────────
*${formattedDoctor}* • *${cleanSpecialty}*
*${cleanClinic}*

Patient: ${patientDisplay}
${paymentLine}${locationBlock}`
  );
}
