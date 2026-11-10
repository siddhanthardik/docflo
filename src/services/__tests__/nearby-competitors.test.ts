import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    competitorSnapshot: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    seoRecommendation: {
      findMany: vi.fn(),
    },
  },
}));

import { GoogleNormalizer } from "../normalization/GoogleNormalizer";
import { GooglePlacesProvider } from "../../lib/google-providers/GooglePlacesProvider";
import { LocalSeoOpportunityService } from "../local-seo-opportunity.service";

describe("Nearby Competitors (5 KM Radius) Architecture & Normalization", () => {
  const clinicLat = 28.5244;
  const clinicLng = 77.1855;
  const clinicPlaceId = "ChIJ_clinic_123";
  const clinicName = "Dr. R. K. Singh Surgical Clinic";

  it("1. strictly discards any competitor further than 5,000 metres (5 km)", () => {
    const mockPlaces = {
      places: [
        {
          id: "comp_close_1",
          displayName: { text: "Apollo Clinic Saket" },
          location: { latitude: 28.5200, longitude: 77.1900 }, // ~650m
          rating: 4.7,
          userRatingCount: 350,
          primaryType: "medical_clinic",
        },
        {
          id: "comp_far_2",
          displayName: { text: "Faraway Hospital Rohini" },
          location: { latitude: 28.7041, longitude: 77.1025 }, // ~22km away
          rating: 4.9,
          userRatingCount: 1200,
          primaryType: "hospital",
        },
        {
          id: "comp_close_3",
          displayName: { text: "Max Smart City Care" },
          location: { latitude: 28.5300, longitude: 77.1700 }, // ~1.6km
          rating: 4.5,
          userRatingCount: 180,
          primaryType: "doctor",
        },
      ],
    };

    const normalized = GoogleNormalizer.normalizeCompetitors(
      mockPlaces,
      clinicLat,
      clinicLng,
      clinicName,
      clinicPlaceId
    );

    expect(normalized.length).toBe(2);
    expect(normalized.map(c => c.placeId)).toEqual(["comp_close_1", "comp_close_3"]);
    normalized.forEach(c => {
      expect(c.distanceMeters).toBeLessThanOrEqual(5000);
    });
  });

  it("2. sorts competitors by physical distance (closest first) by default", () => {
    const mockPlaces = {
      places: [
        {
          id: "comp_medium",
          displayName: { text: "Medium Distance Clinic" },
          location: { latitude: 28.5400, longitude: 77.1855 }, // ~1730m
          rating: 4.8,
          userRatingCount: 200,
        },
        {
          id: "comp_closest",
          displayName: { text: "Immediate Neighbor Clinic" },
          location: { latitude: 28.5260, longitude: 77.1855 }, // ~178m
          rating: 4.2,
          userRatingCount: 50,
        },
        {
          id: "comp_furthest_in_range",
          displayName: { text: "Outer Edge Clinic" },
          location: { latitude: 28.5600, longitude: 77.1855 }, // ~3960m
          rating: 4.9,
          userRatingCount: 500,
        },
      ],
    };

    const normalized = GoogleNormalizer.normalizeCompetitors(
      mockPlaces,
      clinicLat,
      clinicLng,
      clinicName,
      clinicPlaceId
    );

    expect(normalized[0].placeId).toBe("comp_closest");
    expect(normalized[1].placeId).toBe("comp_medium");
    expect(normalized[2].placeId).toBe("comp_furthest_in_range");
    expect(normalized[0].distanceMeters).toBeLessThan(normalized[1].distanceMeters);
    expect(normalized[1].distanceMeters).toBeLessThan(normalized[2].distanceMeters);
  });

  it("3. correctly tags isYou using verified Google Place ID matching", () => {
    const mockPlaces = {
      places: [
        {
          id: clinicPlaceId,
          displayName: { text: "Dr. R. K. Singh Surgical Clinic" },
          location: { latitude: clinicLat, longitude: clinicLng },
          rating: 4.9,
          userRatingCount: 150,
        },
        {
          id: "comp_other_456",
          displayName: { text: "Saket Healthcare Center" },
          location: { latitude: 28.5250, longitude: 77.1860 },
          rating: 4.4,
          userRatingCount: 90,
        },
      ],
    };

    const normalized = GoogleNormalizer.normalizeCompetitors(
      mockPlaces,
      clinicLat,
      clinicLng,
      clinicName,
      clinicPlaceId
    );

    const clinicEntry = normalized.find(c => c.placeId === clinicPlaceId);
    const competitorEntry = normalized.find(c => c.placeId === "comp_other_456");

    expect(clinicEntry).toBeDefined();
    expect(clinicEntry?.isYou).toBe(true);
    expect(competitorEntry?.isYou).toBe(false);
  });

  it("4. maps categories safely to valid Google Places Table A primary types", () => {
    expect(GooglePlacesProvider.mapCategoryToValidTypes("Pediatrician")).toEqual(["doctor", "medical_clinic", "hospital"]);
    expect(GooglePlacesProvider.mapCategoryToValidTypes("Dentist Clinic")).toEqual(["dentist", "medical_clinic", "doctor"]);
    expect(GooglePlacesProvider.mapCategoryToValidTypes("Physiotherapy Center")).toEqual(["physiotherapist", "medical_clinic", "doctor"]);
    expect(GooglePlacesProvider.mapCategoryToValidTypes("Specialist Hospital")).toEqual(["hospital", "medical_clinic", "doctor"]);
    expect(GooglePlacesProvider.mapCategoryToValidTypes("")).toEqual(["doctor", "medical_clinic", "hospital"]);
  });

  it("5. preserves a direct JSON array format compatible with Recommendations route and Opportunity Engine", async () => {
    // Array with clinic and a competitor having 60 reviews ahead
    const snapshotArray = [
      {
        id: clinicPlaceId,
        placeId: clinicPlaceId,
        name: clinicName,
        rating: 4.9,
        reviewCount: 100,
        distanceMeters: 0,
        rank: 1,
        isYou: true,
      },
      {
        id: "comp_top",
        placeId: "comp_top",
        name: "Metro Super Specialty Clinic",
        rating: 4.8,
        reviewCount: 160, // 60 reviews ahead (gap > 20)
        distanceMeters: 1200,
        rank: 2,
        isYou: false,
      },
    ];

    // Verify recommendations route requirement: must be a direct array supporting .filter()
    expect(Array.isArray(snapshotArray)).toBe(true);
    const topCompetitor = snapshotArray.filter(c => !c.isYou).sort((a, b) => b.reviewCount - a.reviewCount)[0];
    expect(topCompetitor).toBeDefined();
    expect(topCompetitor.name).toBe("Metro Super Specialty Clinic");
    expect(topCompetitor.reviewCount - 100).toBe(60);

    // Verify LocalSeoOpportunityService evaluation works without breaking
    const opportunities = await LocalSeoOpportunityService.evaluateCompetitorOpportunities({
      doctorId: "doc_test_123",
      gbpAccountId: "test_gbp_123",
      competitorSnapshot: snapshotArray,
    });

    expect(opportunities.length).toBeGreaterThan(0);
    const reviewGapOpp = opportunities.find(o => o.type === "COMPETITOR_REVIEW_GAP");
    expect(reviewGapOpp).toBeDefined();
    expect(reviewGapOpp?.evidence.metric).toBe("Review Count Gap");
    expect(reviewGapOpp?.metadata?.reviewGap).toBe(60);
  });

  it("6. extracts contact information, directions link and formatted address accurately", () => {
    const mockPlaces = {
      places: [
        {
          id: "comp_with_contact",
          displayName: { text: "Apex Care Clinic" },
          location: { latitude: 28.5255, longitude: 77.1865 },
          rating: 4.6,
          userRatingCount: 88,
          nationalPhoneNumber: "+91 11 2345 6789",
          websiteUri: "https://apexcare.example.com",
          googleMapsUri: "https://maps.google.com/?cid=12345",
          formattedAddress: "Plot 42, Saket Community Centre, New Delhi, Delhi 110017",
          primaryTypeDisplayName: { text: "Pediatric Clinic" },
        },
      ],
    };

    const normalized = GoogleNormalizer.normalizeCompetitors(
      mockPlaces,
      clinicLat,
      clinicLng,
      clinicName,
      clinicPlaceId
    );

    expect(normalized.length).toBe(1);
    const item = normalized[0];
    expect(item.phone).toBe("+91 11 2345 6789");
    expect(item.website).toBe("https://apexcare.example.com");
    expect(item.googleMapsUri).toBe("https://maps.google.com/?cid=12345");
    expect(item.category).toBe("Pediatric Clinic");
    expect(item.formattedAddress).toContain("Saket");
  });

  it("7. enforces strict Place ID precedence: exact Place ID match marks isYou as true", () => {
    const mockPlaces = {
      places: [
        {
          id: "ChIJ_exact_clinic_id",
          displayName: { text: "Any Name On Google" },
          location: { latitude: clinicLat, longitude: clinicLng },
          rating: 4.8,
          userRatingCount: 120,
        },
      ],
    };

    const normalized = GoogleNormalizer.normalizeCompetitors(
      mockPlaces,
      clinicLat,
      clinicLng,
      "Completely Different Name",
      "ChIJ_exact_clinic_id"
    );

    expect(normalized.length).toBe(1);
    expect(normalized[0].isYou).toBe(true);
  });

  it("8. different Place ID with identical or similar clinic name must NOT match when target Place ID is present", () => {
    const mockPlaces = {
      places: [
        {
          id: "ChIJ_competitor_id_999",
          displayName: { text: "Dr. R. K. Singh Surgical Clinic" }, // Identical clinic name!
          location: { latitude: clinicLat, longitude: clinicLng },
          rating: 4.5,
          userRatingCount: 50,
        },
      ],
    };

    const normalized = GoogleNormalizer.normalizeCompetitors(
      mockPlaces,
      clinicLat,
      clinicLng,
      "Dr. R. K. Singh Surgical Clinic",
      "ChIJ_verified_clinic_123" // Clinic has a verified Place ID that differs
    );

    expect(normalized.length).toBe(1);
    // Strict Place ID precedence: MUST NOT match on name when target Place ID exists
    expect(normalized[0].isYou).toBe(false);
  });

  it("9. fallback when target Place ID is missing: exact normalized name equality matches", () => {
    const mockPlaces = {
      places: [
        {
          id: "ChIJ_unknown_place_id",
          displayName: { text: "Dr. R. K. Singh Surgical Clinic" },
          location: { latitude: clinicLat, longitude: clinicLng },
          rating: 4.9,
          userRatingCount: 200,
        },
      ],
    };

    const normalized = GoogleNormalizer.normalizeCompetitors(
      mockPlaces,
      clinicLat,
      clinicLng,
      "dr. r. k. singh surgical clinic", // exact normalized match (case-insensitive)
      undefined // No target Place ID
    );

    expect(normalized.length).toBe(1);
    expect(normalized[0].isYou).toBe(true);
  });

  it("10. fallback when target Place ID is missing: partial name or substring match must NOT match", () => {
    const mockPlaces = {
      places: [
        {
          id: "ChIJ_partial_match_id",
          displayName: { text: "Dr. R. K. Singh Surgical Clinic & Maternity Home" },
          location: { latitude: clinicLat, longitude: clinicLng },
          rating: 4.6,
          userRatingCount: 75,
        },
      ],
    };

    const normalized = GoogleNormalizer.normalizeCompetitors(
      mockPlaces,
      clinicLat,
      clinicLng,
      "Dr. R. K. Singh Surgical Clinic", // substring of the candidate place
      undefined // No target Place ID
    );

    expect(normalized.length).toBe(1);
    // Conservative fallback: partial / substring match is strictly prohibited
    expect(normalized[0].isYou).toBe(false);
  });

  it("11. validates 60-second cooldown calculation logic", () => {
    const REFRESH_COOLDOWN_MS = 60 * 1000;
    const now = Date.now();

    // Scenario A: 25 seconds ago -> cooldown still active, 35 seconds remaining
    const attempt25sAgo = new Date(now - 25 * 1000);
    const elapsedA = now - attempt25sAgo.getTime();
    expect(elapsedA < REFRESH_COOLDOWN_MS).toBe(true);
    const remainingSecondsA = Math.max(1, Math.ceil((REFRESH_COOLDOWN_MS - elapsedA) / 1000));
    expect(remainingSecondsA).toBe(35);

    // Scenario B: 65 seconds ago -> cooldown expired
    const attempt65sAgo = new Date(now - 65 * 1000);
    const elapsedB = now - attempt65sAgo.getTime();
    expect(elapsedB < REFRESH_COOLDOWN_MS).toBe(false);
  });
});
