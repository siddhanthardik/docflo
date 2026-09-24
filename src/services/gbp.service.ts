import { prisma } from "@/lib/prisma";
import type { GbpAccountInsights as GBPInsights, PlaceActionLink, GbpAttribute } from "@/types/gbp";

interface GBPAccount {
  name: string;
  accountName?: string;
  type?: string;
}

interface GBPLocation {
  name: string;
  title?: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
  phoneNumbers?: {
    primaryPhone?: string;
  };
  websiteUri?: string;
  metadata?: {
    mapsUri?: string;
    newReviewUri?: string;
  };
  categories?: any;
  regularHours?: any;
  profile?: {
    description?: string;
  };
}

const ACCOUNT_MANAGEMENT_BASE =
  "https://mybusinessaccountmanagement.googleapis.com/v1";
const BUSINESS_INFORMATION_BASE =
  "https://mybusinessbusinessinformation.googleapis.com/v1";
const PERFORMANCE_BASE = "https://businessprofileperformance.googleapis.com/v1";
const LEGACY_GBP_BASE = "https://mybusiness.googleapis.com/v4";
const PLACE_ACTIONS_BASE = "https://mybusinessplaceactions.googleapis.com/v1";

export const GOOGLE_MEDICAL_CATEGORIES: Record<string, string> = {
  "doctor": "gcid:doctor",
  "medical clinic": "gcid:medical_clinic",
  "clinic": "gcid:medical_clinic",
  "general physician": "gcid:general_practitioner",
  "general practitioner": "gcid:general_practitioner",
  "family doctor": "gcid:family_practice_physician",
  "family practice physician": "gcid:family_practice_physician",
  "consultant physician": "gcid:general_practitioner",
  "physician": "gcid:general_practitioner",
  "pediatrician": "gcid:pediatrician",
  "pediatric care clinic": "gcid:pediatrician",
  "children's health clinic": "gcid:pediatrician",
  "child specialist": "gcid:pediatrician",
  "gynecologist": "gcid:obstetrician_gynecologist",
  "gynaecologist": "gcid:obstetrician_gynecologist",
  "obstetrician-gynecologist": "gcid:obstetrician_gynecologist",
  "women's health clinic": "gcid:womens_health_clinic",
  "maternity hospital": "gcid:maternity_hospital",
  "fertility clinic": "gcid:fertility_clinic",
  "dermatologist": "gcid:dermatologist",
  "skin care clinic": "gcid:skin_care_clinic",
  "hair specialist clinic": "gcid:hair_transplant_clinic",
  "hair transplant clinic": "gcid:hair_transplant_clinic",
  "dentist": "gcid:dentist",
  "dental clinic": "gcid:dental_clinic",
  "orthodontist": "gcid:orthodontist",
  "cosmetic dentist": "gcid:cosmetic_dentist",
  "pediatric dentist": "gcid:pediatric_dentist",
  "orthopedic surgeon": "gcid:orthopedic_surgeon",
  "orthopedist": "gcid:orthopedic_clinic",
  "bone & joint clinic": "gcid:orthopedic_clinic",
  "sports medicine clinic": "gcid:sports_medicine_clinic",
  "cardiologist": "gcid:cardiologist",
  "heart care clinic": "gcid:heart_hospital",
  "cardiovascular center": "gcid:heart_hospital",
  "physiotherapist": "gcid:physiotherapist",
  "physical therapist": "gcid:physical_therapist",
  "physical therapy clinic": "gcid:physical_therapy_clinic",
  "ent specialist": "gcid:ear_nose_and_throat_doctor",
  "ear nose throat clinic": "gcid:ear_nose_and_throat_doctor",
  "ophthalmologist": "gcid:ophthalmologist",
  "eye care clinic": "gcid:eye_care_center",
  "eye specialist": "gcid:ophthalmologist",
  "specialist clinic": "gcid:specialized_clinic",
  "healthcare center": "gcid:medical_clinic",
  "wellness clinic": "gcid:wellness_center",
  "hospital": "gcid:hospital",
  "diagnostic center": "gcid:medical_diagnostic_imaging_center",
  "ultrasound scan center": "gcid:medical_diagnostic_imaging_center",
};

export function normalizeGoogleCategory(categoryInput: string): { name: string; displayName: string } | null {
  if (!categoryInput || typeof categoryInput !== "string") return null;
  const clean = categoryInput.trim();
  if (!clean) return null;

  if (clean.startsWith("categories/")) {
    return { name: clean, displayName: clean.replace("categories/gcid:", "").replace("categories/", "") };
  }
  if (clean.startsWith("gcid:")) {
    return { name: `categories/${clean}`, displayName: clean.replace("gcid:", "") };
  }

  const lookupKey = clean.toLowerCase();
  const matchedGcid = GOOGLE_MEDICAL_CATEGORIES[lookupKey];
  if (matchedGcid) {
    return { name: `categories/${matchedGcid}`, displayName: clean };
  }

  const safeId = clean.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (safeId.length >= 3) {
    return { name: `categories/gcid:${safeId}`, displayName: clean };
  }

  return null;
}

export const GOOGLE_ATTRIBUTE_MAPPING: Record<string, string> = {
  "wheelchair accessible entrance": "has_wheelchair_accessible_entrance",
  "wheelchair accessible restroom": "has_wheelchair_accessible_restroom",
  "appointments recommended": "requires_appointments",
  "online consultations available": "has_online_care",
  "restroom available": "has_restroom",
  "emergency care available": "has_emergency_service",
  "wheelchair access": "has_wheelchair_accessible_entrance",
  "wheelchair accessible": "has_wheelchair_accessible_entrance",
  "restroom": "has_restroom",
  "toilet": "has_restroom",
  "online appointment": "has_online_care",
  "appointment required": "requires_appointments",
};

export function normalizeGoogleAttribute(attrInput: string): string | null {
  if (!attrInput || typeof attrInput !== "string") return null;
  const clean = attrInput.trim();
  if (!clean) return null;

  if (/^[a-z0-9_]+$/.test(clean) && (clean.startsWith("has_") || clean.startsWith("requires_") || clean.startsWith("is_"))) {
    return clean;
  }

  const lookupKey = clean.toLowerCase();
  return GOOGLE_ATTRIBUTE_MAPPING[lookupKey] || null;
}


const LOCATION_READ_MASK = [
  "name",
  "title",
  "storefrontAddress",
  "phoneNumbers",
  "websiteUri",
  "metadata",
  "categories",
  "regularHours",
  "profile"
].join(",");

export function sanitizeGbpPostSummary(summary: string): { cleanSummary: string; hadPhone: boolean } {
  if (!summary) return { cleanSummary: "", hadPhone: false };

  // Google strictly bans phone numbers in post description (phone-stuffing policy).
  // Detect contact patterns with phone labels or 10+ digit phone numbers
  const phonePatternWithLabels = /(?:📞|☎️|📱|Tel|Phone|Call|Mobile|Contact)(?:\s*(?:us|today|now)?)?(?:\s*(?:at|on|:))?\s*(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/gi;
  const rawPhonePattern = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4,5}/g;

  let hadPhone = false;
  let clean = summary;

  if (phonePatternWithLabels.test(clean)) {
    hadPhone = true;
    clean = clean.replace(phonePatternWithLabels, "Tap 'Call Now' below to reach our team.");
  } else if (rawPhonePattern.test(clean)) {
    const matches = clean.match(rawPhonePattern);
    if (matches && matches.some((m) => m.replace(/\D/g, "").length >= 10)) {
      hadPhone = true;
      clean = clean.replace(rawPhonePattern, "");
    }
  }

  // Strip markdown asterisks (e.g. **bold**) as Google expects plain text
  clean = clean.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");

  clean = clean
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();

  return { cleanSummary: clean, hadPhone };
}

export interface GbpErrorInterpretation {
  friendlyMessage: string;
  policyViolationType: "MEDIA" | "PHONE" | "URL" | "LENGTH" | "POLICY" | "INTERNAL" | "AUTH" | "EVENT_SCHEDULE" | "GENERAL";
  suggestedFix: string;
  field?: string;
  rawDetails?: any;
}

export function interpretGbpError(status: number, errorText: string): GbpErrorInterpretation {
  let parsed: any = null;
  try {
    parsed = JSON.parse(errorText);
  } catch (_) {
    parsed = null;
  }

  const code = parsed?.error?.code || status;
  const statusStr = parsed?.error?.status || "";
  const rawMsg = parsed?.error?.message || errorText;
  const details = parsed?.error?.details || [];

  let violatedField = "";
  let fieldDescription = "";
  for (const detail of details) {
    if (detail?.fieldViolations && Array.isArray(detail.fieldViolations)) {
      for (const fv of detail.fieldViolations) {
        violatedField = fv.field || "";
        fieldDescription = fv.description || "";
        break;
      }
    }
  }

  const combinedText = `${rawMsg} ${fieldDescription} ${violatedField} ${errorText}`.toLowerCase();

  // 1. Media / Image Rejection
  if (
    combinedText.includes("media") ||
    combinedText.includes("photo") ||
    combinedText.includes("image") ||
    combinedText.includes("sourceurl") ||
    combinedText.includes("source_url") ||
    combinedText.includes("fetching image failed") ||
    combinedText.includes("media format")
  ) {
    return {
      friendlyMessage: "Google could not process the attached image.",
      policyViolationType: "MEDIA",
      suggestedFix: "Google Business Profile strictly requires photos in JPG or PNG format with a minimum size of 250×250 px (recommended 1200×900 px, 4:3 ratio) and under 5MB. Try uploading a standard JPG/PNG photo or publish as text-only.",
      field: "imageUrl",
      rawDetails: parsed || errorText,
    };
  }

  // 2. Phone number in summary policy
  if (
    combinedText.includes("phone") ||
    combinedText.includes("contact") ||
    combinedText.includes("phone_number")
  ) {
    return {
      friendlyMessage: "Google policy prohibits phone numbers in the update text.",
      policyViolationType: "PHONE",
      suggestedFix: "Google Business Profile anti-spam policy strictly forbids typing phone numbers in the post body. Please remove the phone number from the text and select the 'Call now' button below instead.",
      field: "content",
      rawDetails: parsed || errorText,
    };
  }

  // 3. Action Button (CTA) / URL issues
  if (
    combinedText.includes("calltoaction") ||
    combinedText.includes("actiontype") ||
    combinedText.includes("cta") ||
    combinedText.includes("url must be") ||
    violatedField.includes("calltoaction") ||
    violatedField.includes("url")
  ) {
    return {
      friendlyMessage: "Missing or invalid Action Button link.",
      policyViolationType: "URL",
      suggestedFix: "You selected an action button (like 'Book' or 'Learn more'), but Google requires a valid secure link starting with 'https://'. Please provide a full link (e.g. https://gyrex.in/book/...) or switch the button to 'None'.",
      field: "ctaLink",
      rawDetails: parsed || errorText,
    };
  }

  // 4. Content length / policy violation
  if (
    combinedText.includes("summary") ||
    combinedText.includes("too long") ||
    combinedText.includes("length") ||
    combinedText.includes("maximum")
  ) {
    return {
      friendlyMessage: "Update text exceeds Google's length limit.",
      policyViolationType: "LENGTH",
      suggestedFix: "Google Business Profile allows a maximum of 1,500 characters (150–300 characters recommended). Please shorten your post text and try again.",
      field: "content",
      rawDetails: parsed || errorText,
    };
  }

  // 5. Auth / Permission issues
  if (code === 401 || code === 403 || combinedText.includes("permission") || combinedText.includes("unauthorized")) {
    return {
      friendlyMessage: "Google authorization required or location permissions expired.",
      policyViolationType: "AUTH",
      suggestedFix: "Your Google Business Profile connection may need to be refreshed. Please go to Settings > Google Profile and reconnect your Google account.",
      field: "auth",
      rawDetails: parsed || errorText,
    };
  }

  // 6. Google Internal (500) / Quota / Unverified location
  if (code === 500 || statusStr === "INTERNAL" || combinedText.includes("internal")) {
    return {
      friendlyMessage: "Google returned a service error (HTTP 500).",
      policyViolationType: "INTERNAL",
      suggestedFix: "This occurs if your Google location is still pending verification with Google, or Google experienced a temporary service glitch. You can use the 'Copy Post & Open Google' button below to publish directly on Google Maps.",
      field: "general",
      rawDetails: parsed || errorText,
    };
  }

  // 7. Event / Schedule validation issues
  if (
    combinedText.includes("event") ||
    combinedText.includes("schedule") ||
    combinedText.includes("start_date") ||
    combinedText.includes("end_date") ||
    violatedField.includes("event") ||
    violatedField.includes("schedule")
  ) {
    return {
      friendlyMessage: "Google requires a valid event title and schedule for Event posts.",
      policyViolationType: "EVENT_SCHEDULE",
      suggestedFix: "For Event posts, Google strictly requires a valid event title, start date, and end date. You can also publish as an 'Update' (Standard) post.",
      field: "event",
      rawDetails: parsed || errorText,
    };
  }

  return {
    friendlyMessage: rawMsg || "Failed to publish update to Google Business Profile.",
    policyViolationType: "GENERAL",
    suggestedFix: "Please review the post text, ensure there are no phone numbers or invalid links in the body, and try again.",
    field: "general",
    rawDetails: parsed || errorText,
  };
}

export class GBPService {
  private accessToken: string;
  private doctorId: string;

  constructor(accessToken: string, doctorId: string) {
    this.accessToken = accessToken;
    this.doctorId = doctorId;
  }


  private async googleFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...(init.headers || {}),
      },
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(
        `Google Business Profile API error ${response.status}: ${details}`
      );
    }

    return response.json() as Promise<T>;
  }

  private getPerformanceLocationName(locationName: string) {
    if (/^locations\/[^/]+$/.test(locationName)) {
      return locationName;
    }

    const locationMatch = locationName.match(/\/locations\/([^/]+)/);
    return locationMatch ? `locations/${locationMatch[1]}` : null;
  }

  private sumMetric(data: any, metricName: string) {
    const series =
      data?.multiDailyMetricTimeSeries
        ?.flatMap((item: any) => item.dailyMetricTimeSeries || [])
        ?.filter((item: any) => item.dailyMetric === metricName) || [];

    return series.reduce((metricTotal: number, item: any) => {
      const points = item.timeSeries?.datedValues || [];
      return (
        metricTotal +
        points.reduce(
          (pointTotal: number, point: any) => pointTotal + Number(point.value || 0),
          0
        )
      );
    }, 0);
  }

  async getAccounts(): Promise<GBPAccount[]> {
    const accounts: GBPAccount[] = [];
    let pageToken: string | undefined;

    do {
      const params = new URLSearchParams({ pageSize: "20" });
      if (pageToken) params.set("pageToken", pageToken);

      const data = await this.googleFetch<{
        accounts?: GBPAccount[];
        nextPageToken?: string;
      }>(`${ACCOUNT_MANAGEMENT_BASE}/accounts?${params.toString()}`);

      accounts.push(...(data.accounts || []));
      pageToken = data.nextPageToken;
    } while (pageToken);

    return accounts;
  }

  async getLocations() {
    return this.getAccounts();
  }

  async listLocations(accountName: string): Promise<GBPLocation[]> {
    const locations: GBPLocation[] = [];
    let pageToken: string | undefined;

    do {
      const params = new URLSearchParams({
        pageSize: "100",
        readMask: LOCATION_READ_MASK,
      });
      if (pageToken) params.set("pageToken", pageToken);

      const data = await this.googleFetch<{
        locations?: GBPLocation[];
        nextPageToken?: string;
      }>(
        `${BUSINESS_INFORMATION_BASE}/${accountName}/locations?${params.toString()}`
      );

      locations.push(...(data.locations || []));
      pageToken = data.nextPageToken;
    } while (pageToken);

    return locations;
  }

  async discoverFirstLocation() {
    const accounts = await this.getAccounts();

    for (const account of accounts) {
      const accountLocations = await this.listLocations(account.name);
      const location = accountLocations.find((item) => item.name);

      if (location) {
        return { account, location };
      }
    }

    return null;
  }

  async discoverAllLocations() {
    const accounts = await this.getAccounts();
    const allLocations: { account: GBPAccount; location: GBPLocation }[] = [];

    for (const account of accounts) {
      const accountLocations = await this.listLocations(account.name);
      for (const location of accountLocations) {
        if (location.name) {
          allLocations.push({ account, location });
        }
      }
    }

    return allLocations;
  }

  async getLocationDetails(locationName: string) {
    const params = new URLSearchParams({ readMask: LOCATION_READ_MASK });
    return this.googleFetch<GBPLocation>(
      `${BUSINESS_INFORMATION_BASE}/${locationName}?${params.toString()}`
    );
  }

  async patchLocation(
    locationName: string,
    updateMask: string[],
    data: any
  ): Promise<any> {
    const cleanName = locationName.includes("/locations/")
      ? `locations/${locationName.split("/locations/")[1]}`
      : locationName;

    const url = `${BUSINESS_INFORMATION_BASE}/${cleanName}?updateMask=${encodeURIComponent(updateMask.join(","))}`;
    console.log(`[GBP patchLocation] Patching ${cleanName} with mask ${updateMask.join(",")}:`, JSON.stringify(data));

    return this.googleFetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  }

  async getPlaceActionLinks(locationName: string): Promise<PlaceActionLink[]> {
    const cleanName = locationName.includes("/locations/")
      ? `locations/${locationName.split("/locations/")[1]}`
      : locationName;
    try {
      const url = `${PLACE_ACTIONS_BASE}/${cleanName}/placeActionLinks`;
      const data = await this.googleFetch<{ placeActionLinks?: PlaceActionLink[] }>(url);
      return data.placeActionLinks || [];
    } catch (err: any) {
      console.warn("[GBP getPlaceActionLinks] Error reading place action links:", err.message);
      return [];
    }
  }

  async upsertPlaceActionLink(
    locationName: string,
    uri: string,
    actionType: "APPOINTMENT" | "ONLINE_APPOINTMENT" = "APPOINTMENT"
  ): Promise<PlaceActionLink> {
    const cleanName = locationName.includes("/locations/")
      ? `locations/${locationName.split("/locations/")[1]}`
      : locationName;

    let cleanUri = uri.trim();
    if (!cleanUri.startsWith("http://") && !cleanUri.startsWith("https://")) {
      cleanUri = `https://${cleanUri}`;
    }

    // 1. Fetch existing place action links to check for existing links for this actionType
    const existingLinks = await this.getPlaceActionLinks(cleanName);
    const editableLink = existingLinks.find((l) => l.placeActionType === actionType && l.isEditable !== false);
    const nonEditableLink = existingLinks.find((l) => l.placeActionType === actionType && l.isEditable === false);

    if (editableLink?.name) {
      // Update existing editable link
      const updateUrl = `${PLACE_ACTIONS_BASE}/${editableLink.name}?updateMask=uri,isPreferred`;
      console.log(`[GBP upsertPlaceActionLink] Patching editable action link ${editableLink.name} with URI: ${cleanUri}`);
      return this.googleFetch<PlaceActionLink>(updateUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uri: cleanUri,
          isPreferred: true,
        }),
      });
    }

    // Create new place action link if no editable link exists.
    // If a non-editable third-party link is present and Google prevents adding another, report a friendly message.
    const createUrl = `${PLACE_ACTIONS_BASE}/${cleanName}/placeActionLinks`;
    console.log(`[GBP upsertPlaceActionLink] Creating new action link at ${createUrl} with URI: ${cleanUri}`);
    try {
      return await this.googleFetch<PlaceActionLink>(createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uri: cleanUri,
          placeActionType: actionType,
          isPreferred: true,
        }),
      });
    } catch (createErr: any) {
      if (nonEditableLink) {
        throw new Error(
          "Your Google Business Profile currently has an appointment booking link managed by an external provider (such as Practo or Reserve with Google). Google does not permit overriding this provider link directly."
        );
      }
      throw createErr;
    }
  }

  async deletePlaceActionLink(linkName: string): Promise<any> {
    const url = `${PLACE_ACTIONS_BASE}/${linkName}`;
    return this.googleFetch(url, { method: "DELETE" });
  }

  async getLocationAttributes(locationName: string): Promise<GbpAttribute[]> {
    const cleanName = locationName.includes("/locations/")
      ? `locations/${locationName.split("/locations/")[1]}`
      : locationName;
    try {
      const url = `${BUSINESS_INFORMATION_BASE}/${cleanName}/attributes`;
      const data = await this.googleFetch<{ attributes?: GbpAttribute[] }>(url);
      return data.attributes || [];
    } catch (err: any) {
      console.warn("[GBP getLocationAttributes] Error reading attributes:", err.message);
      return [];
    }
  }

  async updateLocationAttributes(locationName: string, attributeDisplayNames: string[]): Promise<any> {
    const cleanName = locationName.includes("/locations/")
      ? `locations/${locationName.split("/locations/")[1]}`
      : locationName;

    const attributes: GbpAttribute[] = [];
    const unmapped: string[] = [];

    for (const item of attributeDisplayNames) {
      const attrId = normalizeGoogleAttribute(item);
      if (attrId) {
        attributes.push({
          name: `${cleanName}/attributes/${attrId}`,
          values: [true],
        });
      } else {
        unmapped.push(item);
      }
    }

    if (attributes.length === 0 && attributeDisplayNames.length > 0) {
      throw new Error(`None of the provided attributes could be mapped to recognized Google attribute IDs: ${unmapped.join(", ")}`);
    }

    // Build exact FieldMask dynamically containing only the attribute paths being updated
    // e.g. attributeMask=attributes/has_wheelchair_accessible_entrance,attributes/has_restroom
    const attributeMask = attributes
      .map((a) => {
        const parts = a.name.split("/attributes/");
        const attrId = parts[1] || a.name;
        return `attributes/${attrId}`;
      })
      .join(",");

    const url = `${BUSINESS_INFORMATION_BASE}/${cleanName}/attributes?attributeMask=${encodeURI(attributeMask)}`;
    console.log(`[GBP updateLocationAttributes] Updating attributes for ${cleanName} with mask ${attributeMask}:`, JSON.stringify(attributes));

    return this.googleFetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attributes }),
    });
  }


  async getInsights(locationName: string, startDate: Date, endDate: Date): Promise<GBPInsights> {
    try {
      const performanceLocationName = this.getPerformanceLocationName(locationName);
      if (!performanceLocationName) {
        throw new Error("Invalid Google Business Profile location format");
      }

      const currentParams = new URLSearchParams();
      [
        "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
        "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
        "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
        "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
        "WEBSITE_CLICKS",
        "CALL_CLICKS",
        "BUSINESS_DIRECTION_REQUESTS",
        "BUSINESS_BOOKINGS"
      ].forEach((metric) => currentParams.append("dailyMetrics", metric));
      
      currentParams.set("dailyRange.start_date.year", String(startDate.getFullYear()));
      currentParams.set("dailyRange.start_date.month", String(startDate.getMonth() + 1));
      currentParams.set("dailyRange.start_date.day", String(startDate.getDate()));
      currentParams.set("dailyRange.end_date.year", String(endDate.getFullYear()));
      currentParams.set("dailyRange.end_date.month", String(endDate.getMonth() + 1));
      currentParams.set("dailyRange.end_date.day", String(endDate.getDate()));

      const previousStartDate = new Date(startDate);
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
      const prevEndDate = new Date(endDate);
      prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);

      const prevParams = new URLSearchParams(currentParams.toString());
      prevParams.set("dailyRange.start_date.year", String(previousStartDate.getFullYear()));
      prevParams.set("dailyRange.start_date.month", String(previousStartDate.getMonth() + 1));
      prevParams.set("dailyRange.start_date.day", String(previousStartDate.getDate()));
      prevParams.set("dailyRange.end_date.year", String(prevEndDate.getFullYear()));
      prevParams.set("dailyRange.end_date.month", String(prevEndDate.getMonth() + 1));
      prevParams.set("dailyRange.end_date.day", String(prevEndDate.getDate()));

      const [data, prevData] = await Promise.all([
        this.googleFetch<any>(`${PERFORMANCE_BASE}/${performanceLocationName}:fetchMultiDailyMetricsTimeSeries?${currentParams.toString()}`),
        this.googleFetch<any>(`${PERFORMANCE_BASE}/${performanceLocationName}:fetchMultiDailyMetricsTimeSeries?${prevParams.toString()}`)
      ]);

      const desktopMaps = this.sumMetric(data, "BUSINESS_IMPRESSIONS_DESKTOP_MAPS");
      const desktopSearch = this.sumMetric(data, "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH");
      const mobileMaps = this.sumMetric(data, "BUSINESS_IMPRESSIONS_MOBILE_MAPS");
      const mobileSearch = this.sumMetric(data, "BUSINESS_IMPRESSIONS_MOBILE_SEARCH");
      
      const mapsViews = desktopMaps + mobileMaps;
      const searchViews = desktopSearch + mobileSearch;
      const totalViews = searchViews + mapsViews;
      
      const websiteClicks = this.sumMetric(data, "WEBSITE_CLICKS");
      const phoneCalls = this.sumMetric(data, "CALL_CLICKS");
      const directionRequests = this.sumMetric(data, "BUSINESS_DIRECTION_REQUESTS");
      const bookings = this.sumMetric(data, "BUSINESS_BOOKINGS");
      const totalActions = websiteClicks + phoneCalls + directionRequests + bookings;

      // Previous Year
      const prevDesktopMaps = this.sumMetric(prevData, "BUSINESS_IMPRESSIONS_DESKTOP_MAPS");
      const prevDesktopSearch = this.sumMetric(prevData, "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH");
      const prevMobileMaps = this.sumMetric(prevData, "BUSINESS_IMPRESSIONS_MOBILE_MAPS");
      const prevMobileSearch = this.sumMetric(prevData, "BUSINESS_IMPRESSIONS_MOBILE_SEARCH");
      const prevMapsViews = prevDesktopMaps + prevMobileMaps;
      const prevSearchViews = prevDesktopSearch + prevMobileSearch;
      const prevTotalViews = prevSearchViews + prevMapsViews;

      const prevWebsiteClicks = this.sumMetric(prevData, "WEBSITE_CLICKS");
      const prevPhoneCalls = this.sumMetric(prevData, "CALL_CLICKS");
      const prevDirectionRequests = this.sumMetric(prevData, "BUSINESS_DIRECTION_REQUESTS");
      const prevBookings = this.sumMetric(prevData, "BUSINESS_BOOKINGS");
      const prevTotalActions = prevWebsiteClicks + prevPhoneCalls + prevDirectionRequests + prevBookings;

      const calcChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 100);
      };

      const viewsChange = calcChange(totalViews, prevTotalViews);
      const actionsChange = calcChange(totalActions, prevTotalActions);

      const insights: GBPInsights = {
        locationName,
        profileName: locationName,
        totalSearches: totalViews,
        directSearches: 0,
        discoverySearches: 0,
        totalViews,
        searchViews,
        mapsViews,
        totalActions,
        websiteClicks,
        phoneCalls,
        directionRequests,
        viewsChange,
        searchChange: viewsChange,
        actionsChange
      };

      // Extract time series for charts
      const timeSeriesData = data.multiDailyMetricTimeSeries || [];

      const accountRecord = await prisma.gbpAccount.findUnique({
        where: {
          doctorId_locationName: {
            doctorId: this.doctorId,
            locationName: locationName,
          },
        },
        select: { insightsData: true },
      });
      const existingInsights = (accountRecord?.insightsData as any) || {};

      const newInsightsData = {
        ...existingInsights,
        ...insights,
        desktopMaps,
        desktopSearch,
        mobileMaps,
        mobileSearch,
        timeSeriesData,
        bookings,
        fetchedMonth: `${startDate.getFullYear()}-${startDate.getMonth() + 1}`,
        cacheVersion: 2
      };

      await prisma.gbpAccount.update({
        where: {
          doctorId_locationName: {
            doctorId: this.doctorId,
            locationName: locationName,
          },
        },
        data: {
          insightsData: newInsightsData as any,
          lastSyncAt: new Date(),
        },
      });

      return insights;
    } catch (error) {
      console.error("Error fetching GBP insights:", error);
      throw error;
    }
  }

  async getSearchKeywords(locationName: string, startMonth: Date, endMonth: Date) {
    try {
      const performanceLocationName = this.getPerformanceLocationName(locationName);
      if (!performanceLocationName) {
        return [];
      }

      const params = new URLSearchParams({ pageSize: "100" });
      params.set("monthlyRange.start_month.year", String(startMonth.getFullYear()));
      params.set("monthlyRange.start_month.month", String(startMonth.getMonth() + 1));
      params.set("monthlyRange.end_month.year", String(endMonth.getFullYear()));
      params.set("monthlyRange.end_month.month", String(endMonth.getMonth() + 1));

      const data = await this.googleFetch<any>(
        `${PERFORMANCE_BASE}/${performanceLocationName}/searchkeywords/impressions/monthly?${params.toString()}`
      );

      const keywords = (data.searchKeywordsCounts || []).map((item: any) => ({
        query: item.searchKeyword,
        impressions: Number(item.insightsValue?.value || item.insightsValue?.threshold || 0),
        clicks: 0,
        ctr: 0,
        avgPosition: 0,
        trend: "stable",
      }));

      const accountRecord = await prisma.gbpAccount.findUnique({
        where: {
          doctorId_locationName: {
            doctorId: this.doctorId,
            locationName: locationName,
          },
        },
      });
      const existingInsights = (accountRecord?.insightsData as any) || {};
      existingInsights.searchKeywords = keywords;
      await prisma.gbpAccount.update({
        where: {
          doctorId_locationName: {
            doctorId: this.doctorId,
            locationName: locationName,
          },
        },
        data: { insightsData: existingInsights },
      });

      return keywords;
    } catch (error) {
      console.error("Error fetching search keywords:", error);
      return [];
    }
  }

  async getReviews(locationName: string, gbpAccountId?: string) {
    try {
      let fullPath = locationName.trim();
      
      if (!fullPath.startsWith("accounts/")) {
        let accountName: string | undefined;
        if (gbpAccountId) {
          const acc = await prisma.gbpAccount.findUnique({ where: { id: gbpAccountId } });
          const insights = (acc?.insightsData as any) || {};
          accountName = insights.accountName;
        }
        if (!accountName) {
          try {
            const accountsData = await this.googleFetch<any>(`${LEGACY_GBP_BASE}/accounts`);
            if (accountsData?.accounts?.[0]?.name) {
              accountName = accountsData.accounts[0].name;
            }
          } catch (e) {
            console.warn("[GBPService] Could not fetch accounts list:", e);
          }
        }
        if (accountName) {
          const locPart = fullPath.startsWith("locations/") ? fullPath : `locations/${fullPath}`;
          fullPath = `${accountName}/${locPart}`;
        }
      }

      if (!fullPath.startsWith("accounts/")) {
        console.warn(`[GBPService] Cannot fetch reviews: location path "${fullPath}" is not in accounts/X/locations/Y format.`);
        return [];
      }

      const allRawReviews: any[] = [];
      let pageToken: string | undefined = undefined;
      let averageRating: number | undefined;
      let totalReviewCount: number | undefined;

      do {
        const params = new URLSearchParams({
          pageSize: "50",
          orderBy: "updateTime desc",
        });
        if (pageToken) params.set("pageToken", pageToken);

        const data = await this.googleFetch<any>(
          `${LEGACY_GBP_BASE}/${fullPath}/reviews?${params.toString()}`
        );
        
        if (data.reviews) {
          allRawReviews.push(...data.reviews);
        }
        
        // Capture stats from first page
        if (!pageToken) {
          averageRating = data.averageRating;
          totalReviewCount = data.totalReviewCount;
        }

        pageToken = data.nextPageToken;
      } while (pageToken);

      const reviews = allRawReviews.map((review: any) => ({
        reviewId: review.reviewId,
        reviewerName: review.reviewer?.displayName || "Google user",
        rating:
          review.starRating === "FIVE" ? 5 :
          review.starRating === "FOUR" ? 4 :
          review.starRating === "THREE" ? 3 :
          review.starRating === "TWO" ? 2 :
          review.starRating === "ONE" ? 1 : 0,
        comment: review.comment || "",
        createTime: review.createTime,
        reply: review.reviewReply?.comment || null,
      }));

      if (gbpAccountId && (averageRating !== undefined || totalReviewCount !== undefined)) {
        const account = await prisma.gbpAccount.findUnique({ where: { id: gbpAccountId } });
        if (account) {
          const insights = (account.insightsData as any) || {};
          insights.rating = averageRating || insights.rating || 0;
          insights.user_ratings_total = totalReviewCount || insights.user_ratings_total || 0;
          
          await prisma.gbpAccount.update({
            where: { id: gbpAccountId },
            data: { insightsData: insights }
          });
        }
      }

      for (const review of reviews) {
        await prisma.review.upsert({
          where: { id: review.reviewId },
          update: {
            rating: review.rating,
            comment: review.comment,
            reply: review.reply,
            responded: !!review.reply,
            gbpAccountId: gbpAccountId || undefined,
          },
          create: {
            id: review.reviewId,
            doctorId: this.doctorId,
            gbpAccountId: gbpAccountId || undefined,
            reviewerName: review.reviewerName,
            rating: review.rating,
            comment: review.comment,
            reply: review.reply,
            source: "GOOGLE",
            reviewDate: new Date(review.createTime),
            responded: !!review.reply,
          },
        });
      }

      // Cleanup: Delete reviews from the database that are no longer present in Google's API response
      // This ensures the local database count perfectly matches the live Google Reviews count.
      if (gbpAccountId) {
        const fetchedReviewIds = reviews.map((r: any) => r.reviewId);
        await prisma.review.deleteMany({
          where: {
            doctorId: this.doctorId,
            gbpAccountId: gbpAccountId,
            source: "GOOGLE",
            id: { notIn: fetchedReviewIds },
          },
        });
      }

      return reviews;
    } catch (error) {
      console.error("Error fetching GBP reviews:", error);
      throw error;
    }
  }

  async replyToReview(
    locationName: string,
    reviewId: string,
    comment: string
  ) {
    try {
      if (!locationName.startsWith("accounts/")) {
        throw new Error("Reviews can only be managed for OAuth-connected GBP locations");
      }

      const response = await fetch(
        `${LEGACY_GBP_BASE}/${locationName}/reviews/${reviewId}/reply`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ comment }),
        }
      );
      if (!response.ok) throw new Error("Failed to reply to review");

      await prisma.review.update({
        where: { id: reviewId },
        data: { reply: comment, responded: true },
      });
      return await response.json();
    } catch (error) {
      console.error("Error replying to review:", error);
      throw error;
    }
  }

  async createPost(
    locationName: string,
    summary: string,
    topicType: string = "STANDARD",
    imageUrl?: string,
    ctaType?: string,
    ctaLink?: string,
    languageCode: string = "en-US",
    eventOptions?: {
      title?: string | null;
      startDate?: Date | string | null;
      endDate?: Date | string | null;
    }
  ) {
    try {
      if (!locationName.startsWith("accounts/")) {
        throw new Error("Posts can only be created for OAuth-connected GBP locations");
      }

      // Pre-flight sanitize summary to prevent Google content filter rejections
      const { cleanSummary, hadPhone } = sanitizeGbpPostSummary(summary);
      let effectiveCtaType = ctaType;

      // If user included a phone number in text and had no action button, auto-attach "Call Now"
      if (hadPhone && (!effectiveCtaType || effectiveCtaType === "NONE")) {
        effectiveCtaType = "CALL";
      }

      const normalizedTopic = (topicType || "STANDARD").toUpperCase();

      // Build the request body for GBP API
      const body: any = {
        summary: cleanSummary || summary,
        languageCode,
        topicType: normalizedTopic,
      };

      // Construct compliant event structure if topicType is EVENT or OFFER
      if (normalizedTopic === "EVENT" || normalizedTopic === "OFFER") {
        const start = eventOptions?.startDate ? new Date(eventOptions.startDate) : new Date();
        const fallbackEnd = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day default window
        const end = eventOptions?.endDate ? new Date(eventOptions.endDate) : fallbackEnd;
        const validEnd = end >= start ? end : fallbackEnd;

        // Google requires title max 58 characters
        let eventTitle = (eventOptions?.title || "").trim();
        if (!eventTitle) {
          const firstSentence = (cleanSummary || summary).split(/[.\n]/)[0].trim();
          eventTitle = firstSentence.slice(0, 55) || "Health & Wellness Event";
        }

        body.event = {
          title: eventTitle.slice(0, 58),
          schedule: {
            startDate: {
              year: start.getFullYear(),
              month: start.getMonth() + 1,
              day: start.getDate(),
            },
            endDate: {
              year: validEnd.getFullYear(),
              month: validEnd.getMonth() + 1,
              day: validEnd.getDate(),
            },
          },
        };
      }

      // Add Media (Image)
      if (imageUrl) {
        let fullUrl = imageUrl;
        if (imageUrl.startsWith("/")) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gyrex.in";
          fullUrl = `${baseUrl}${imageUrl}`;
        }

        body.media = [
          {
            mediaFormat: "PHOTO",
            sourceUrl: fullUrl,
          },
        ];
      }

      // Add Call to Action
      if (effectiveCtaType && effectiveCtaType !== "NONE") {
        if (effectiveCtaType === "CALL") {
          body.callToAction = {
            actionType: "CALL",
          };
        } else if (ctaLink && ctaLink.trim()) {
          let cleanLink = ctaLink.trim();
          if (!cleanLink.startsWith("http://") && !cleanLink.startsWith("https://")) {
            cleanLink = `https://${cleanLink}`;
          }
          body.callToAction = {
            actionType: effectiveCtaType,
            url: cleanLink,
          };
        }
      }

      const targetUrl = `${LEGACY_GBP_BASE}/${locationName}/localPosts`;
      console.log(`[GBP createPost] Sending payload to ${targetUrl}:`, JSON.stringify(body));

      const response = await fetch(
        targetUrl,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("GBP createPost error:", response.status, errorText);

        const interpretation = interpretGbpError(response.status, errorText);
        const err: any = new Error(interpretation.friendlyMessage);
        err.interpretation = interpretation;
        throw err;
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  }
}

