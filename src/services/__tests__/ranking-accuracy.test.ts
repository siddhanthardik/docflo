import { describe, it, expect } from "vitest";
import { calculateSoLV } from "@/lib/audit/google-places";
import { GoogleNormalizer } from "@/services/normalization/GoogleNormalizer";

describe("GYREX Phase 1 & Phase 2 Ranking Accuracy & Normalization", () => {
  describe("SoLV Calculation (Phase 2)", () => {
    it("computes 100% SoLV when all 25 nodes are rank 1", () => {
      const nodes = Array.from({ length: 25 }, () => ({ rank: 1, found: true }));
      const result = calculateSoLV(nodes);
      expect(result.solv).toBe(100);
      expect(result.top3Coverage).toBe(100);
      expect(result.top10Coverage).toBe(100);
      expect(result.avgRankFound).toBe(1);
      expect(result.unrankedCount).toBe(0);
      expect(result.foundCount).toBe(25);
    });

    it("computes 0% SoLV when clinic is not found in top 20 across all nodes", () => {
      const nodes = Array.from({ length: 25 }, () => ({ rank: 21, found: false }));
      const result = calculateSoLV(nodes);
      expect(result.solv).toBe(0);
      expect(result.top3Coverage).toBe(0);
      expect(result.top10Coverage).toBe(0);
      expect(result.avgRankFound).toBeNull();
      expect(result.unrankedCount).toBe(25);
      expect(result.foundCount).toBe(0);
    });

    it("computes weighted SoLV correctly for realistic test case", () => {
      // Test Case: Dr. Vinay Kumar Rai - 5 nodes at rank 5 (weight 50), 10 nodes at rank 10 (weight 25), 10 unranked (weight 0)
      const nodes = [
        ...Array.from({ length: 5 }, () => ({ rank: 5, found: true })),
        ...Array.from({ length: 10 }, () => ({ rank: 10, found: true })),
        ...Array.from({ length: 10 }, () => ({ rank: 25, found: false })),
      ];
      const result = calculateSoLV(nodes);
      // Expected total weight = (5 * 50) + (10 * 25) + 0 = 250 + 250 = 500
      // Max weight = 25 * 100 = 2500
      // SoLV = (500 / 2500) * 100 = 20%
      expect(result.solv).toBe(20);
      expect(result.top3Coverage).toBe(0);
      expect(result.top10Coverage).toBe(60); // 15 of 25 nodes
      expect(result.avgRankFound).toBe(8.3); // (5*5 + 10*10) / 15 = 125 / 15 = 8.33
      expect(result.unrankedCount).toBe(10);
      expect(result.foundCount).toBe(15);
    });
  });

  describe("Doctor vs Hospital & Specialty Guardrails (Phase 1)", () => {
    const mockPlaces = {
      places: [
        {
          id: "place_dr_vinay",
          displayName: { text: "Dr. Vinay Kumar Rai - Pediatrician" },
          primaryType: "pediatrician",
          primaryTypeDisplayName: { text: "Pediatrician" },
          userRatingCount: 93,
          rating: 4.8,
          location: { latitude: 28.5672, longitude: 77.2001 },
        },
        {
          id: "place_wanshika",
          displayName: { text: "Wanshika Hospital" },
          primaryType: "hospital",
          primaryTypeDisplayName: { text: "Hospital" },
          userRatingCount: 291,
          rating: 4.5,
          location: { latitude: 28.5673, longitude: 77.2002 },
        },
        {
          id: "place_dentist",
          displayName: { text: "Safdarjung Dental Clinic" },
          primaryType: "dentist",
          primaryTypeDisplayName: { text: "Dentist" },
          userRatingCount: 45,
          rating: 4.9,
          location: { latitude: 28.5670, longitude: 77.2010 },
        },
        {
          id: "place_pharmacy",
          displayName: { text: "Apollo Pharmacy Safdarjung" },
          primaryType: "pharmacy",
          primaryTypeDisplayName: { text: "Pharmacy" },
          userRatingCount: 120,
          rating: 4.2,
          location: { latitude: 28.5660, longitude: 77.2015 },
        },
        {
          id: "place_dr_rajeev",
          displayName: { text: "Doctor Rajeev Seth - Pediatrician" },
          primaryType: "pediatrician",
          primaryTypeDisplayName: { text: "Pediatrician" },
          userRatingCount: 789,
          rating: 4.9,
          location: { latitude: 28.5680, longitude: 77.1990 },
        },
      ],
    };

    it("correctly identifies doctor practitioner listing using verified placeId", () => {
      const normalized = GoogleNormalizer.normalizeCompetitors(
        mockPlaces,
        28.5672,
        77.2001,
        "Dr. Vinay Kumar Rai",
        "place_dr_vinay",
        { maxDistanceMeters: 0, sortByDistance: false }
      );

      const drVinay = normalized.find((c) => c.placeId === "place_dr_vinay");
      expect(drVinay).toBeDefined();
      expect(drVinay?.isYou).toBe(true);
      expect(drVinay?.isPractitioner).toBe(true);
      expect(drVinay?.isHospital).toBe(false);
      expect(drVinay?.profileType).toBe("doctor");
    });

    it("distinguishes hospital institutional listing from doctor practitioner listing", () => {
      const normalized = GoogleNormalizer.normalizeCompetitors(
        mockPlaces,
        28.5672,
        77.2001,
        "Dr. Vinay Kumar Rai",
        "place_dr_vinay",
        { maxDistanceMeters: 0, sortByDistance: false }
      );

      const wanshika = normalized.find((c) => c.placeId === "place_wanshika");
      expect(wanshika).toBeDefined();
      expect(wanshika?.isHospital).toBe(true);
      expect(wanshika?.isPractitioner).toBe(false);
      expect(wanshika?.profileType).toBe("hospital");
    });

    it("flags unrelated specialties (dentists and pharmacies) for filtering", () => {
      const normalized = GoogleNormalizer.normalizeCompetitors(
        mockPlaces,
        28.5672,
        77.2001,
        "Dr. Vinay Kumar Rai",
        "place_dr_vinay",
        { maxDistanceMeters: 0, sortByDistance: false }
      );

      const dental = normalized.find((c) => c.placeId === "place_dentist");
      const pharmacy = normalized.find((c) => c.placeId === "place_pharmacy");
      const drRajeev = normalized.find((c) => c.placeId === "place_dr_rajeev");

      expect(dental?.specialtyMismatch).toBe(true);
      expect(pharmacy?.specialtyMismatch).toBe(true);
      expect(drRajeev?.specialtyMismatch).toBe(false);
      expect(drRajeev?.isPractitioner).toBe(true);
    });
  });
});
