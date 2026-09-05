import { prisma } from "@/lib/prisma";
import { detectSpeciality } from "@/lib/audit/healthcare-intelligence";
import {
  fetchPlaceDetails,
  searchCompetitorsWithRank,
  buildLocalSearchQuery,
  extractNeighborhood,
  unifiedGeoGrid,
  calculateCompositeRank,
} from "@/lib/audit/google-places";

export interface AuditScanInput {
  placeId?: string | null;
  name?: string;
  address?: string;
  searchQuery?: string;
}

/**
 * Executes a full 10-section diagnostic audit scan against Google Places API and competitors in a 5km radius.
 */
export async function executeAuditScan(auditId: string, data: AuditScanInput) {
  try {
    await prisma.auditRequest.update({
      where: { id: auditId },
      data: { progress: 30 },
    });

    // 1. Fetch Real Google Places Data
    let placeData = null;
    if (data.placeId) {
      placeData = await fetchPlaceDetails(data.placeId);
    }

    await prisma.auditRequest.update({
      where: { id: auditId },
      data: { progress: 60 },
    });

    // 2. Classify Healthcare Speciality
    const actualName = placeData?.name || data.name || data.searchQuery || "Clinic";
    const actualCategories = placeData?.types || [];
    const locationStr = placeData?.formattedAddress || data.address || "";
    const specialityData = detectSpeciality(
      actualName,
      actualCategories,
      locationStr,
      placeData?.primaryType || null,
      placeData?.primaryTypeDisplayName || null,
      placeData?.reviewsText || []
    );

    console.log(
      `[AuditScanService] ${actualName} → Detected specialty: "${specialityData.speciality}" | GBP primaryType: "${placeData?.primaryType}" | displayName: "${placeData?.primaryTypeDisplayName}"`
    );

    await prisma.auditRequest.update({
      where: { id: auditId },
      data: { progress: 80 },
    });

    // 3. Fetch Real Competitors — same category, 5 km radius
    const addressParts = locationStr.split(",").map((p: string) => p.trim()).filter(Boolean);
    const cityStr =
      addressParts.length >= 2 ? addressParts[addressParts.length - 2] : addressParts[0] || "";

    const specialtyLabel = specialityData.speciality;

    const localSearchQuery = buildLocalSearchQuery(specialtyLabel, locationStr);
    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";

    let gridData = null;
    let compositeData = null;
    const targetLocation =
      placeData?.lat && placeData?.lng ? { lat: placeData.lat, lng: placeData.lng } : undefined;
    let locationContext = undefined;

    const extracted = await extractNeighborhood(locationStr, apiKey);
    if (extracted) {
      locationContext = extracted.searchPhrase;
      if (targetLocation) {
        gridData = await unifiedGeoGrid(
          specialtyLabel,
          locationContext,
          targetLocation.lat,
          targetLocation.lng,
          actualName,
          apiKey
        );
        compositeData = calculateCompositeRank(
          gridData.ranks,
          gridData.centroidRank,
          gridData.organicRank
        );
      }
    }

    const { competitors: competitorsData, userRank } = await searchCompetitorsWithRank(
      specialtyLabel,
      data.placeId || "",
      actualName,
      targetLocation,
      locationContext
    );

    if (!compositeData) {
      compositeData = {
        compositeRank: userRank,
        confidence: "low",
        avgGridRank: userRank,
        stdDev: 0,
      };
    }

    await prisma.auditRequest.update({
      where: { id: auditId },
      data: { progress: 90 },
    });

    // 4. Dynamic Scoring & Degradation Logic
    const hasData = !!placeData;
    const isUnknown = specialityData.isUnknown;

    let gbpScore = 0;
    let trustScore = 0;
    let websiteScore = 0;

    if (placeData) {
      let items = 0;
      if (placeData.name) items++;
      if (placeData.formattedAddress) items++;
      if (placeData.website) items++;
      if (placeData.phone) items++;
      if (placeData.hasOpeningHours) items++;
      if (placeData.types && placeData.types.length > 0) items++;
      if (placeData.rating && placeData.reviewCount && placeData.reviewCount > 0) items++;
      if (placeData.photoUrl) items++;

      gbpScore = Math.min(100, Math.round((items / 8) * 100));

      if (placeData.rating && placeData.reviewCount) {
        if (placeData.reviewCount >= 100) trustScore += 40;
        else if (placeData.reviewCount >= 50) trustScore += 20;
        else if (placeData.reviewCount > 0) trustScore += 10;

        if (placeData.rating >= 4.5) trustScore += 60;
        else if (placeData.rating >= 4.0) trustScore += 40;
        else if (placeData.rating >= 3.5) trustScore += 20;
      }

      if (placeData.website) {
        websiteScore = placeData.website.startsWith("https") ? 100 : 50;
      }
    }

    const competitorScore = 0;
    const overallScore = hasData ? Math.round((gbpScore + websiteScore + trustScore) / 3) : 0;
    const reviewCountStr = placeData?.reviewCount ? placeData.reviewCount.toString() : "0";

    const compReviewCounts = competitorsData
      .map((c) => c.reviewCount || 0)
      .filter((cnt) => cnt > 0)
      .sort((a, b) => a - b);

    const compAvgReviews =
      compReviewCounts.length > 0
        ? (() => {
            const mid = Math.floor(compReviewCounts.length / 2);
            return compReviewCounts.length % 2 !== 0
              ? compReviewCounts[mid]
              : Math.round((compReviewCounts[mid - 1] + compReviewCounts[mid]) / 2);
          })()
        : 100;

    // 5. Save to Database (Diagnostic Report Mapping)
    const report = await prisma.auditReport.create({
      data: {
        requestId: auditId,
        businessName: actualName,
        speciality: specialityData.speciality,
        address: placeData?.formattedAddress || data.address || "Data unavailable",
        websiteUrl: placeData?.website || null,

        primaryCategory:
          placeData?.primaryTypeDisplayName ||
          placeData?.primaryType ||
          specialityData.speciality,
        secondaryCategories: placeData?.types || [],
        businessType: "Local Healthcare",
        rating: placeData?.rating || null,
        reviewCount: placeData?.reviewCount || null,

        competitors: {
          create: competitorsData.map((c) => ({
            name: c.name,
            rating: c.rating,
            reviewCount: c.reviewCount,
          })),
        },

        // 1. Business Overview
        businessOverview: {
          businessName: placeData?.name || actualName,
          primaryCategory:
            placeData?.primaryTypeDisplayName ||
            placeData?.primaryType ||
            specialityData.speciality,
          additionalCategories:
            placeData?.types?.filter((t) => t !== placeData?.primaryType) || [],
          address: placeData?.formattedAddress || data.address || "Not Available",
          phone: placeData?.phone || "Not Available",
          website: placeData?.website || "Not Available",
          rating: placeData?.rating || "Not Available",
          reviews: placeData?.reviewCount || "Not Available",
          businessStatus: placeData?.businessStatus || "Not Available",
          photoUrl: placeData?.photoUrl || null,
        },

        // 2. Business Snapshot
        businessSnapshot: {
          metrics: [
            {
              id: "reviews",
              label: "Total Reviews",
              observed: placeData?.reviewCount ?? "Not Available",
              benchmark: compAvgReviews,
            },
            {
              id: "rating",
              label: "Average Rating",
              observed: placeData?.rating ?? "Not Available",
              benchmark: specialityData.expectedRating,
            },
            { id: "photos", label: "Photos Published", observed: "Unable to verify", benchmark: "30+" },
            { id: "posts", label: "Recent Google Posts", observed: "Unable to verify", benchmark: "2-3/month" },
            { id: "categories", label: "Categories Used", observed: placeData?.types?.length || 1, benchmark: 3 },
            { id: "services", label: "Services Listed", observed: "Unable to verify", benchmark: "10+" },
            { id: "booking", label: "Booking Link", observed: "Unable to verify", benchmark: "Active" },
          ],
        },

        // 3. Why You're Losing Visibility
        visibilityIssues: {
          issues:
            !isUnknown && hasData
              ? [
                  (placeData?.reviewCount || 0) < compAvgReviews
                    ? {
                        issue:
                          userRank === 1
                            ? `Review Velocity: Competitors average ${compAvgReviews} reviews.`
                            : `Review Deficit: Only ${reviewCountStr} reviews found.`,
                        evidence:
                          userRank === 1
                            ? `Although you currently hold the #1 rank, collecting regular monthly reviews protects your leadership against high-volume competitors.`
                            : `Nearby competitors average ${compAvgReviews} reviews on Google Maps.`,
                        impact: userRank === 1 ? "Medium" : "High",
                      }
                    : null,
                  !placeData?.website
                    ? {
                        issue: "No website link found on Google Maps.",
                        evidence:
                          "Google relies on website structure and EEAT signals to verify medical authority.",
                        impact: "High",
                      }
                    : null,
                  (placeData?.types?.length || 0) <= 2
                    ? {
                        issue: "Secondary medical categories missing.",
                        evidence:
                          "Nearby competitors use an average of 3-4 categories to capture multi-specialty patient searches.",
                        impact: "High",
                      }
                    : null,
                  placeData?.rating && placeData.rating < specialityData.expectedRating
                    ? {
                        issue: `Rating below local benchmark (${placeData.rating} vs ${specialityData.expectedRating}).`,
                        evidence:
                          "Patients are proven to filter out clinics with ratings lower than their immediate local peers.",
                        impact: "High",
                      }
                    : null,
                  !placeData?.name?.toLowerCase().includes(specialityData.speciality.toLowerCase())
                    ? {
                        issue: `Primary keyword "${specialityData.speciality}" not found in business title.`,
                        evidence:
                          "Profiles missing the exact specialty keyword in their title struggle to rank for broad category searches.",
                        impact: "High",
                      }
                    : null,
                  !placeData?.photoUrl
                    ? {
                        issue: "No clinic photos or media published.",
                        evidence:
                          "Profiles with interior and exterior photos receive 42% more requests for directions on Google Maps.",
                        impact: "Medium",
                      }
                    : null,
                  !placeData?.phone
                    ? {
                        issue: "No direct phone line connected.",
                        evidence:
                          "Without a listed phone number, you are missing out on immediate mobile tap-to-call conversions.",
                        impact: "Critical",
                      }
                    : null,
                  !placeData?.hasOpeningHours
                    ? {
                        issue: "Missing business hours.",
                        evidence:
                          "Profiles without hours cannot rank for 'open now' searches.",
                        impact: "Medium",
                      }
                    : null,
                ].filter(Boolean)
              : [
                  {
                    issue: "Insufficient Google Data.",
                    evidence: "We could not verify your clinic details on Google Maps.",
                    impact: "Critical",
                  },
                ],
        },

        // 4. Competitor Intelligence
        competitorIntelligence: {
          gridData: gridData ? gridData.ranks : null,
          compositeData,
          searchContext: locationContext || cityStr,
          centerLat: targetLocation?.lat || extracted?.lat || null,
          centerLng: targetLocation?.lng || extracted?.lng || null,
          spacingMeters: 500,
          competitors: [
            ...competitorsData.map((c, i) => ({
              name: c.name,
              isYou: false,
              rating: c.rating || "N/A",
              reviewCount: c.reviewCount || 0,
              rank: c.googlePosition || (userRank <= i + 1 ? i + 2 : i + 1),
              googlePosition: c.googlePosition,
              website: "Unknown",
            })),
            {
              name: actualName,
              isYou: true,
              rating: placeData?.rating || "N/A",
              reviewCount: placeData?.reviewCount || 0,
              rank: userRank > 20 ? "20+" : userRank,
              categories: placeData?.types?.length || 1,
              website: placeData?.website ? "Yes" : "No",
            },
          ],
        },

        // 5. Profile Completeness Standard
        profileCompleteness: {
          items: [
            { name: "Business Name Verified", present: !!placeData?.name },
            { name: "Primary Medical Category", present: !!placeData?.primaryType },
            {
              name: "Secondary Medical Categories (3+)",
              present: (placeData?.types?.length || 0) >= 3,
            },
            { name: "Geocoded Street Address", present: !!placeData?.formattedAddress },
            { name: "Direct Phone Line", present: !!placeData?.phone },
            { name: "Official Website Link", present: !!placeData?.website },
            {
              name: "Secure SSL Website (HTTPS)",
              present: !!(placeData?.website && placeData.website.startsWith("https")),
            },
            { name: "Configured Business Hours", present: !!placeData?.hasOpeningHours },
            { name: "Rating Benchmark (4.5★+)", present: (placeData?.rating || 0) >= 4.5 },
            {
              name: "Review Count Benchmark Match",
              present: (placeData?.reviewCount || 0) >= compAvgReviews,
            },
            {
              name: "Patient Reviews Verified (10+)",
              present: (placeData?.reviewCount || 0) >= 10,
            },
            { name: "Clinic Photos & Media Published", present: !!placeData?.photoUrl },
          ],
        },

        // 6. Competitor Gap Analysis
        competitorGapAnalysis: {
          metrics: [
            {
              metric: "Total Reviews",
              you: placeData?.reviewCount || 0,
              average: compAvgReviews,
              best: Math.max(
                ...competitorsData.map((c) => c.reviewCount || 0),
                placeData?.reviewCount || 0
              ),
            },
            {
              metric: "Google Rating",
              you: placeData?.rating || 0,
              average: specialityData.expectedRating,
              best: 5.0,
            },
          ],
        },

        // 7. Healthcare Intelligence
        healthcareIntelligence: {
          specialty: specialityData.speciality,
          expectedServices: (function (s: string) {
            const spec = s.toLowerCase();
            if (spec.includes("pediatr") || spec.includes("child")) {
              return [
                "Newborn Care",
                "Child Vaccination & Immunization",
                "Growth & Development Monitoring",
                "Pediatric Nutrition",
                "Fever & Allergy Care",
                "Childhood Asthma",
              ];
            }
            if (
              spec.includes("gynaec") ||
              spec.includes("gynec") ||
              spec.includes("obstet") ||
              spec.includes("pregnancy")
            ) {
              return [
                "Pregnancy & Prenatal Care",
                "High Risk Pregnancy",
                "PCOS / PCOD Management",
                "Fetal Medicine & Ultrasound",
                "Infertility Consultation",
                "Laparoscopic Surgery",
              ];
            }
            if (spec.includes("dentist") || spec.includes("dental")) {
              return [
                "Teeth Whitening",
                "Root Canal Treatment",
                "Dental Implants",
                "Orthodontics & Braces",
                "Tooth Extraction",
                "Pediatric Dentistry",
              ];
            }
            if (spec.includes("derma") || spec.includes("skin")) {
              return [
                "Acne & Scar Treatment",
                "Laser Hair Removal",
                "Botox & Dermal Fillers",
                "Chemical Peel",
                "Hair Loss & PRP Treatment",
                "Skin Pigmentation",
              ];
            }
            if (spec.includes("ortho")) {
              return [
                "Joint Replacement",
                "Arthritis Management",
                "Fracture & Trauma Care",
                "Spine Care",
                "Sports Injury Treatment",
              ];
            }
            if (spec.includes("eye") || spec.includes("ophthalm")) {
              return [
                "Cataract Surgery",
                "LASIK & Vision Correction",
                "Glaucoma Treatment",
                "Dry Eye Therapy",
                "Pediatric Ophthalmology",
              ];
            }
            if (spec.includes("ivf") || spec.includes("fertility")) {
              return [
                "IVF Treatment",
                "IUI Consultation",
                "Fertility Preservation",
                "Semen Analysis",
                "Egg Freezing",
              ];
            }
            if (spec.includes("lab") || spec.includes("diagnost")) {
              return [
                "Blood Test",
                "MRI Scan",
                "CT Scan",
                "X-Ray",
                "Ultrasound Diagnostics",
              ];
            }
            return [
              "General Consultation",
              "Preventive Health Checkup",
              "Patient Diagnosis & Follow-up",
              "Prescription & Care",
            ];
          })(specialityData.speciality),
        },

        // 8. Priority Action Plan
        priorityActionPlan: {
          tasks: [
            !placeData?.website
              ? {
                  problem: "No Website Link",
                  evidence: "Google relies on websites for EEAT signals.",
                  time: "10 mins",
                  impact: "High",
                  difficulty: "Easy",
                }
              : null,
            (placeData?.reviewCount || 0) < compAvgReviews
              ? {
                  problem: "Review Deficit",
                  evidence: `You need ${
                    compAvgReviews - (placeData?.reviewCount || 0)
                  } reviews to match the local average.`,
                  time: "Ongoing",
                  impact: "High",
                  difficulty: "Medium",
                }
              : null,
            isUnknown
              ? {
                  problem: "Generic Category",
                  evidence: "Your primary category limits your appearance in specialty searches.",
                  time: "5 mins",
                  impact: "High",
                  difficulty: "Easy",
                }
              : null,
            {
              problem: "Missing Services/Products",
              evidence: "Unable to verify if your treatments are listed natively on Google.",
              time: "30 mins",
              impact: "Medium",
              difficulty: "Medium",
            },
          ].filter(Boolean),
        },

        // 9. Growth Opportunities
        growthOpportunities: {
          strategies: [
            {
              title: "Enable Google Messaging",
              description: "Convert searchers directly from the map pack.",
            },
            {
              title: "Automate Review Collection",
              description:
                "Send WhatsApp requests post-appointment to steadily build review velocity.",
            },
            {
              title: "Publish Weekly Google Posts",
              description:
                "Share treatment updates, before/afters, and health tips to keep the profile fresh.",
            },
            {
              title: "List Individual Treatments as Services",
              description:
                "Helps you rank when patients search for specific procedures rather than just your clinic name.",
            },
          ],
        },

        // 10. AI Action Plan (Locked)
        aiActionPlan: {
          lockedMessage:
            "Unlock the exact step-by-step blueprint to implement these fixes, outrank competitors, and acquire more patients automatically.",
        },
      },
    });

    await prisma.auditRequest.update({
      where: { id: auditId },
      data: { progress: 100, status: "COMPLETED" },
    });

    const completedReq = await prisma.auditRequest.findUnique({
      where: { id: auditId },
      include: { lead: true },
    });

    if (completedReq?.leadId) {
      await prisma.leadActivity.create({
        data: {
          leadId: completedReq.leadId,
          eventType: "AUDIT_COMPLETED",
          message: `Audit report generated for ${actualName} (Score: ${overallScore}/100, Rank: #${userRank}).`,
          metadata: {
            auditId,
            overallScore,
            rating: placeData?.rating,
            reviewCount: placeData?.reviewCount,
            userRank,
          },
        },
      });
    }

    return {
      success: true,
      report,
      placeData,
      specialityData,
      overallScore,
      userRank,
      compAvgReviews,
      auditId,
    };
  } catch (error: any) {
    console.error("[AuditScanService] Failed:", error);
    await prisma.auditRequest.update({
      where: { id: auditId },
      data: { status: "FAILED" },
    });

    const failedReq = await prisma.auditRequest.findUnique({ where: { id: auditId } });
    if (failedReq?.leadId) {
      await prisma.leadActivity.create({
        data: {
          leadId: failedReq.leadId,
          eventType: "AUDIT_FAILED",
          message: "Failed to generate audit report.",
          metadata: { auditId, error: error?.message || "Unknown error" },
        },
      });
    }

    throw error;
  }
}
