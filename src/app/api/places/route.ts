import { NextRequest, NextResponse } from "next/server";

const HEALTH_TYPES = [
  "doctor", "hospital", "pharmacy", "dentist", "physiotherapist",
  "health", "clinic", "medical", "hospital_ward", "veterinary_care",
];

// ── Attempt 1: Places API (New) ─────────────────────────────────
async function searchWithGoogleNew(input: string, apiKey: string) {
  const body = JSON.stringify({
    input,
    includedRegionCodes: ["in"],
  });

  const fieldMask = [
    "suggestions.placePrediction.placeId",
    "suggestions.placePrediction.text",
    "suggestions.placePrediction.structuredFormat",
    "suggestions.placePrediction.types",
  ].join(",");

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
      // Pass the origin to satisfy key HTTP-referrer restrictions
      "Origin": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
    },
    body,
  });

  if (!res.ok) return null;
  const data = await res.json();
  const suggestions = data.suggestions || [];

  return suggestions.map((s: any) => {
    const p = s.placePrediction || {};
    return {
      place_id: p.placeId || "",
      structured_formatting: {
        main_text: p.structuredFormat?.mainText?.text || p.text?.text || "",
        secondary_text: p.structuredFormat?.secondaryText?.text || "",
      },
      types: p.types || [],
    };
  });
}

// ── Attempt 2: Nominatim (OpenStreetMap) — no key, always works ──
async function searchWithNominatim(input: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", input);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "7");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("extratags", "1");

  const res = await fetch(url.toString(), {
    headers: {
      // Nominatim requires a descriptive User-Agent
      "User-Agent": "Docflo/1.0 (healthcare-platform; contact@docflo.in)",
      "Accept-Language": "en",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) return [];
  const data = await res.json();

  const mapped = data.map((item: any) => {
    const addr = item.address || {};
    const nameStr = item.name || item.display_name?.split(",")[0] || input;
    
    // Use the full display name (minus the venue name itself) as the secondary address text
    let fullAddress = item.display_name;
    if (fullAddress && fullAddress.includes(nameStr)) {
        fullAddress = fullAddress.replace(nameStr, "").replace(/^,\s*/, "").trim();
    } else if (fullAddress && fullAddress.includes(",")) {
        fullAddress = fullAddress.substring(fullAddress.indexOf(",") + 1).trim();
    }
    
    // Fallback if somehow empty
    if (!fullAddress) {
        fullAddress = [addr.city || addr.town || addr.village || addr.county, addr.state, "India"].filter(Boolean).join(", ");
    }

    return {
      place_id: item.place_id?.toString() || item.osm_id?.toString() || "",
      structured_formatting: {
        main_text: nameStr,
        secondary_text: fullAddress || "India",
      },
      types: [item.type || "establishment"],
      source: "nominatim",
    };
  });

  // Prefer healthcare types, but include all if not enough results
  const healthTypes = ["hospital", "clinic", "doctors", "dentist", "pharmacy", "health", "nursing_home", "medical_centre"];
  const healthFirst = [
    ...mapped.filter((r: any) => healthTypes.includes(r.types[0])),
    ...mapped.filter((r: any) => !healthTypes.includes(r.types[0])),
  ];

  return healthFirst.slice(0, 6);
}

// ── Attempt 3: Fallback — generate smart suggestions from input ──
function generateFallbackSuggestions(input: string) {
  const locations = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata"];
  return locations.slice(0, 4).map((loc, i) => ({
    place_id: `fallback-${i}`,
    structured_formatting: {
      main_text: input,
      secondary_text: `${loc}, India`,
    },
    types: ["health"],
    source: "fallback",
  }));
}

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input");

  if (!input || input.trim().length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  let predictions: any[] = [];

  // Try Google Places API (New) first
  if (apiKey) {
    try {
      const googleResults = await searchWithGoogleNew(input, apiKey);
      if (googleResults && googleResults.length > 0) {
        predictions = googleResults;
      }
    } catch (err) {
      console.error("[Places] Google API error:", err);
    }
  }

  // Fallback to Nominatim if Google didn't work
  if (predictions.length === 0) {
    try {
      const nominatimResults = await searchWithNominatim(input);
      if (nominatimResults.length > 0) {
        predictions = nominatimResults.slice(0, 6);
      }
    } catch (err) {
      console.error("[Places] Nominatim error:", err);
    }
  }

  // Last resort: generate placeholder suggestions so the user can still proceed
  if (predictions.length === 0) {
    predictions = generateFallbackSuggestions(input);
  }

  return NextResponse.json({ predictions }, {
    headers: { "Cache-Control": "no-store" },
  });
}
