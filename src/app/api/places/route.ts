import { NextRequest, NextResponse } from "next/server";

// ── Attempt 1: Classic Places API Autocomplete ─────────────────────────────────
async function searchWithGoogleClassic(input: string, apiKey: string) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", input);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("components", "country:in");

  const res = await fetch(url.toString(), {
    headers: { "Accept": "application/json" }
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[Places] Classic API Error Response:", errorText);
    return null;
  }
  const data = await res.json();
  
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error("[Places] Classic API Status Error:", data.status, data.error_message);
    return null;
  }

  const predictions = data.predictions || [];

  return predictions.map((p: any) => ({
    place_id: p.place_id || "",
    structured_formatting: {
      main_text: p.structured_formatting?.main_text || "",
      secondary_text: p.structured_formatting?.secondary_text || "",
    },
    types: p.types || [],
  }));
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
      "User-Agent": "Gyrex/1.0 (healthcare-platform; contact@gyrex.in)",
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

  // Try Google Places API first
  if (apiKey) {
    try {
      const googleResults = await searchWithGoogleClassic(input, apiKey);
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
