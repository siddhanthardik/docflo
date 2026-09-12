/**
 * Utility to resolve canonical clinic address and exact Google Maps / GMB links.
 * 
 * Prevents contamination of addresses (e.g. appending stale DB city to GMB address)
 * and guarantees exact Google Maps CID/Place directions links instead of generic search URLs.
 */

export interface ClinicLocationInput {
  name?: string | null;
  clinicName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  googleReviewLink?: string | null;
  gbpAccounts?: Array<{
    insightsData?: any;
  }> | null;
}

export interface ResolvedClinicLocation {
  address: string;
  mapsUrl: string | null;
  source: "GMB_EXACT" | "PLACE_ID" | "DOCTOR_FALLBACK";
}

/**
 * Resolves the canonical, verified clinic address and exact Google Maps directions link.
 */
export function resolveExactClinicLocation(
  doctor: ClinicLocationInput | null | undefined,
  gbpAccountOverride?: { insightsData?: any } | null
): ResolvedClinicLocation {
  const cleanClinicName = (doctor?.clinicName || doctor?.name || "Clinic").trim();

  // 1. Check GBP Account (Override or first linked account)
  const gbpAccount = gbpAccountOverride || doctor?.gbpAccounts?.[0] || null;
  const insights = (gbpAccount?.insightsData && typeof gbpAccount.insightsData === "object")
    ? (gbpAccount.insightsData as Record<string, any>)
    : null;

  const gmbFormattedAddress = insights?.formattedAddress ? String(insights.formattedAddress).trim() : null;
  const gmbMapsUri = insights?.mapsUri ? String(insights.mapsUri).trim() : null;

  // 2. Resolve Canonical Address
  let resolvedAddress = "";

  if (gmbFormattedAddress && gmbFormattedAddress.length > 5) {
    // Ground truth from Google Maps / GMB
    resolvedAddress = gmbFormattedAddress;
  } else {
    // Build from Doctor profile cleanly
    const rawAddress = (doctor?.address || "").trim();
    const rawCity = (doctor?.city || "").trim();

    if (rawAddress) {
      // Check if address already contains the city or PIN code
      const hasCityAlready = rawCity && rawAddress.toLowerCase().includes(rawCity.toLowerCase());
      const hasPinCode = /\b\d{6}\b/.test(rawAddress);
      const isMultiSegment = rawAddress.split(",").length >= 3;

      if (hasCityAlready || hasPinCode || isMultiSegment || !rawCity) {
        resolvedAddress = rawAddress;
      } else {
        resolvedAddress = `${rawAddress}, ${rawCity}`;
      }
    } else if (rawCity) {
      resolvedAddress = rawCity;
    } else {
      resolvedAddress = cleanClinicName;
    }
  }

  // 3. Resolve Exact Google Maps / Directions Link
  let resolvedMapsUrl: string | null = null;
  let source: "GMB_EXACT" | "PLACE_ID" | "DOCTOR_FALLBACK" = "DOCTOR_FALLBACK";

  // Option A: Direct GMB Maps URI (e.g. https://maps.google.com/maps?cid=...)
  if (gmbMapsUri && gmbMapsUri.startsWith("http")) {
    resolvedMapsUrl = gmbMapsUri;
    source = "GMB_EXACT";
  }

  // Option B: Extract Place ID from newReviewUri or googleReviewLink
  if (!resolvedMapsUrl) {
    const reviewUri = (insights?.newReviewUri as string) || doctor?.googleReviewLink || "";
    const placeIdMatch = reviewUri.match(/placeid=([A-Za-z0-9_-]+)/i);
    if (placeIdMatch && placeIdMatch[1]) {
      const placeId = placeIdMatch[1];
      resolvedMapsUrl = `https://www.google.com/maps/dir/?api=1&destination_place_id=${placeId}&destination=${encodeURIComponent(cleanClinicName)}`;
      source = "PLACE_ID";
    }
  }

  // Option C: Clean Direct Google Maps Navigation Link (Using /maps/dir/ for turn-by-turn navigation)
  if (!resolvedMapsUrl && (resolvedAddress || cleanClinicName)) {
    const destinationQuery = [cleanClinicName, resolvedAddress]
      .filter(Boolean)
      .join(", ")
      .trim();
    resolvedMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationQuery)}`;
    source = "DOCTOR_FALLBACK";
  }

  return {
    address: resolvedAddress,
    mapsUrl: resolvedMapsUrl,
    source,
  };
}
