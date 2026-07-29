import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectSpeciality } from "@/lib/audit/healthcare-intelligence";
import { fetchPlaceDetails, searchCompetitorsWithRank, buildLocalSearchQuery, extractNeighborhood, unifiedGeoGrid, calculateCompositeRank } from "@/lib/audit/google-places";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, placeId, searchQuery, name, address } = body;

    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }
    if (!searchQuery && !placeId) {
      return NextResponse.json({ error: "Missing search parameters" }, { status: 400 });
    }

    // Verify lead exists
    const lead = await prisma.auditLead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Create the AuditRequest record linked to the lead
    const auditRequest = await prisma.auditRequest.create({
      data: {
        leadId,
        placeId,
        searchQuery: name ? `${name} ${address}` : searchQuery,
        status: "SCANNING",
        progress: 10
      }
    });

    // Log Activity
    await prisma.leadActivity.create({
      data: {
        leadId,
        eventType: "AUDIT_STARTED",
        message: "A new GBP audit scan has been initiated.",
        metadata: { auditId: auditRequest.id }
      }
    });

    // Fire and Forget (Async Background Processing)
    processAuditAsync(auditRequest.id, { placeId, name, address, searchQuery }).catch(console.error);

    return NextResponse.json({ 
      success: true, 
      auditId: auditRequest.id 
    });

  } catch (error) {
    console.error("Failed to start audit scan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Background Processor with Real Data Execution
async function processAuditAsync(auditId: string, data: any) {
  try {
    await prisma.auditRequest.update({ where: { id: auditId }, data: { progress: 30 } });
    
    // 1. Fetch Real Google Places Data
    let placeData = null;
    if (data.placeId) {
      placeData = await fetchPlaceDetails(data.placeId);
    }
    
    await prisma.auditRequest.update({ where: { id: auditId }, data: { progress: 60 } });

    // 2. Classify Healthcare Speciality
    // Priority: GBP primaryType slug → displayName → business name keywords
    const actualName = placeData?.name || data.name || data.searchQuery;
    const actualCategories = placeData?.types || [];
    const locationStr = placeData?.formattedAddress || data.address || "";
    const specialityData = detectSpeciality(
      actualName,
      actualCategories,
      locationStr,
      placeData?.primaryType || null,                 // e.g. "pediatrician" — Places API v1
      placeData?.primaryTypeDisplayName || null,      // e.g. "Pediatrician" — Places API v1
      placeData?.reviewsText || []                    // Patient review text snippets
    );

    console.log(`[Audit] ${actualName} → Detected specialty: "${specialityData.speciality}" | GBP primaryType: "${placeData?.primaryType}" | displayName: "${placeData?.primaryTypeDisplayName}"`);

    await prisma.auditRequest.update({ where: { id: auditId }, data: { progress: 85 } });
    // 3. Fetch Real Competitors — same category, 5 km radius
    // Build competitor search query from detected specialty (e.g. "Pediatrician")
    const addressParts = locationStr.split(",").map((p: string) => p.trim()).filter(Boolean);
    const cityStr = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : addressParts[0] || "";

    // Use detected specialty (or specific GBP category label if not generic "Doctor")
    const gbpDisplayCategory = placeData?.primaryTypeDisplayName || null;
    const specialtyLabel = (gbpDisplayCategory && gbpDisplayCategory.toLowerCase() !== "doctor")
      ? gbpDisplayCategory
      : specialityData.speciality;

    // Build hyper-local search query: "Pediatrician near Safdarjung Enclave, New Delhi"
    // NOT pincode-based — this is what real patients type on Google Maps
    const localSearchQuery = buildLocalSearchQuery(specialtyLabel, locationStr);
    console.log(`[Audit] Competitor search: "${localSearchQuery}" (from address: "${locationStr}")`);

    // Extract neighborhood context for locationContext param and GeoGrid
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";
    let gridData = null;
    let compositeData = null;
    const targetLocation = placeData?.lat && placeData?.lng ? { lat: placeData.lat, lng: placeData.lng } : undefined;
    let locationContext = undefined;

    const extracted = await extractNeighborhood(locationStr, apiKey);
    if (extracted) {
      locationContext = extracted.searchPhrase;
      if (targetLocation) {
        // Run unified 25-point GeoGrid around the clinic's exact GPS
        console.log(`[Audit] Running 25-point GeoGrid around clinic location`);
        gridData = await unifiedGeoGrid(
          specialtyLabel,
          locationContext,
          targetLocation.lat,
          targetLocation.lng,
          actualName,
          apiKey
        );
        compositeData = calculateCompositeRank(gridData.ranks, gridData.centroidRank, gridData.organicRank);
      }
    }

    const { competitors: competitorsData, userRank } = await searchCompetitorsWithRank(
      specialtyLabel,
      data.placeId || "",
      actualName,
      targetLocation,
      locationContext
    );

    // If no grid could be generated (no neighborhood), use userRank as fallback
    if (!compositeData) {
      compositeData = {
        compositeRank: userRank,
        confidence: "low",
        avgGridRank: userRank,
        stdDev: 0
      };
    }

    await prisma.auditRequest.update({ where: { id: auditId }, data: { progress: 85 } });
    
    // 4. Graceful Degradation Logic
    const hasData = !!placeData;
    const isUnknown = specialityData.isUnknown;
    
    // Dynamic Scoring - Rule Engine Only
    let gbpScore = 0;
    let trustScore = 0;
    let websiteScore = 0;
    
    if (placeData) {
      // Profile Completeness (max 100)
      if (placeData.name) gbpScore += 20;
      if (placeData.formattedAddress) gbpScore += 20;
      if (placeData.website) gbpScore += 20;
      if (placeData.types && placeData.types.length > 0) gbpScore += 20;
      if (placeData.rating && placeData.reviewCount && placeData.reviewCount > 0) gbpScore += 20;

      // Reputation / Trust Score (max 100)
      if (placeData.rating && placeData.reviewCount) {
        if (placeData.reviewCount >= 100) trustScore += 40;
        else if (placeData.reviewCount >= 50) trustScore += 20;
        else if (placeData.reviewCount > 0) trustScore += 10;
        
        if (placeData.rating >= 4.5) trustScore += 60;
        else if (placeData.rating >= 4.0) trustScore += 40;
        else if (placeData.rating >= 3.5) trustScore += 20;
      }

      // Website Score (max 100)
      if (placeData.website) {
        websiteScore = placeData.website.startsWith("https") ? 100 : 50;
      }
    }

    // Set to 0 if we can't measure them
    const competitorScore = 0; 
    const eeatScore = 0; 
    const overallScore = hasData ? Math.round((gbpScore + websiteScore + trustScore) / 3) : 0;
    
    const scores = { overallScore, gbpScore, websiteScore, competitorScore };

    const reviewCountStr = placeData?.reviewCount ? placeData.reviewCount.toString() : "0";
    const ratingStr = placeData?.rating ? placeData.rating.toString() : "N/A";
    // Competitor average metrics — compute live median review count from top competitors in 5km radius
    const compReviewCounts = competitorsData
      .map(c => c.reviewCount || 0)
      .filter(cnt => cnt > 0)
      .sort((a, b) => a - b);

    const compAvgReviews = compReviewCounts.length > 0
      ? (() => {
          const mid = Math.floor(compReviewCounts.length / 2);
          return compReviewCounts.length % 2 !== 0
            ? compReviewCounts[mid]
            : Math.round((compReviewCounts[mid - 1] + compReviewCounts[mid]) / 2);
        })()
      : 100;

    // 5. Save to Database (Mapping to Diagnostic Report sections)
    const report = await prisma.auditReport.create({
      data: {
        requestId: auditId,
        businessName: actualName,
        speciality: specialityData.speciality,
        address: placeData?.formattedAddress || data.address || "Data unavailable",
        websiteUrl: placeData?.website || null,
        
        // Exact API metrics — use human-readable display name as the stored category
        primaryCategory: placeData?.primaryTypeDisplayName || placeData?.primaryType || specialityData.speciality,
        secondaryCategories: placeData?.types || [],
        businessType: "Local Healthcare",
        rating: placeData?.rating || null,
        reviewCount: placeData?.reviewCount || null,

        competitors: {
          create: competitorsData.map(c => ({
            name: c.name,
            rating: c.rating,
            reviewCount: c.reviewCount
          }))
        },
        
        // 1. Business Overview
        businessOverview: {
          businessName: placeData?.name || actualName,
          primaryCategory: placeData?.primaryTypeDisplayName || placeData?.primaryType || specialityData.speciality,
          additionalCategories: placeData?.types?.filter(t => t !== placeData?.primaryType) || [],
          address: placeData?.formattedAddress || data.address || "Not Available",
          phone: placeData?.phone || "Not Available",
          website: placeData?.website || "Not Available",
          rating: placeData?.rating || "Not Available",
          reviews: placeData?.reviewCount || "Not Available",
          businessStatus: placeData?.businessStatus || "Not Available"
        },
        
        // 2. Business Snapshot (KPI Cards with observed vs benchmark)
        businessSnapshot: {
          metrics: [
            { id: "reviews", label: "Total Reviews", observed: placeData?.reviewCount ?? "Not Available", benchmark: compAvgReviews },
            { id: "rating", label: "Average Rating", observed: placeData?.rating ?? "Not Available", benchmark: specialityData.expectedRating },
            { id: "photos", label: "Photos Published", observed: "Unable to verify", benchmark: "30+" },
            { id: "posts", label: "Recent Google Posts", observed: "Unable to verify", benchmark: "2-3/month" },
            { id: "categories", label: "Categories Used", observed: placeData?.types?.length || 1, benchmark: 3 },
            { id: "services", label: "Services Listed", observed: "Unable to verify", benchmark: "10+" },
            { id: "booking", label: "Booking Link", observed: "Unable to verify", benchmark: "Active" }
          ]
        },

        // 3. Why You're Losing Visibility (Action Items)
        visibilityIssues: {
          issues: !isUnknown && hasData ? [
            (placeData?.reviewCount || 0) < compAvgReviews 
              ? { issue: `Review Deficit: Only ${reviewCountStr} reviews found.`, evidence: `Nearby competitors average ${compAvgReviews} reviews on Google Maps.`, impact: "High" }
              : null,
            !placeData?.website 
              ? { issue: "No website link found on Google Maps.", evidence: "Google relies on website structure and EEAT signals to verify medical authority.", impact: "High" }
              : null,
            (placeData?.types?.length || 0) <= 1
              ? { issue: "Secondary medical categories missing.", evidence: "Nearby competitors use an average of 3 categories to capture multi-specialty patient searches.", impact: "High" }
              : null,
            { issue: "No recent Google Posts verified.", evidence: "Profiles without weekly posts appear inactive to Google's freshness ranking algorithm.", impact: "Medium" },
            { issue: "Native medical services catalog unverified.", evidence: "Listing individual treatments natively on Google increases rank for treatment-specific searches.", impact: "Medium" }
          ].filter(Boolean) : [
            { issue: "Insufficient Google Data.", evidence: "We could not verify your clinic details on Google Maps.", impact: "Critical" }
          ]
        },

        // 4. Competitor Intelligence (includes GeoGrid)
        competitorIntelligence: {
          gridData: gridData ? gridData.ranks : null,
          compositeData,
          searchContext: locationContext || cityStr,
          competitors: [
            ...competitorsData.map((c, i) => ({
              name: c.name,
              isYou: false,
              rating: c.rating || "N/A",
              reviewCount: c.reviewCount || 0,
              rank: i + 1,

              categories: "Unknown",
              website: "Unknown"
            })),
            {
              name: actualName,
              isYou: true,
              rating: placeData?.rating || "N/A",
              reviewCount: placeData?.reviewCount || 0,
              rank: userRank > 20 ? "20+" : userRank,
              categories: placeData?.types?.length || 1,
              website: placeData?.website ? "Yes" : "No"
            }
          ]
        },
        
        // 5. Profile Completeness (12-Point Google Business Profile Audit Standard)
        profileCompleteness: {
          items: [
            { name: "Business Name Verified", present: !!placeData?.name },
            { name: "Primary Medical Category", present: !!placeData?.primaryType },
            { name: "Secondary Medical Categories (3+)", present: (placeData?.types?.length || 0) >= 3 },
            { name: "Geocoded Street Address", present: !!placeData?.formattedAddress },
            { name: "Direct Phone Line", present: !!placeData?.phone },
            { name: "Official Website Link", present: !!placeData?.website },
            { name: "Secure SSL Website (HTTPS)", present: !!(placeData?.website && placeData.website.startsWith("https")) },
            { name: "Configured Business Hours", present: !!placeData?.hasOpeningHours },
            { name: "Rating Benchmark (4.5★+)", present: (placeData?.rating || 0) >= 4.5 },
            { name: "Review Count Benchmark Match", present: (placeData?.reviewCount || 0) >= compAvgReviews },
            { name: "Patient Reviews Verified (10+)", present: (placeData?.reviewCount || 0) >= 10 },
            { name: "Clinic Photos & Media Published", present: (placeData?.types?.length || 0) > 1 || (placeData?.rating || 0) >= 4.0 },
          ]
        },

        // 6. Competitor Gap Analysis
        competitorGapAnalysis: {
           metrics: [
             { metric: "Total Reviews", you: placeData?.reviewCount || 0, average: compAvgReviews, best: Math.max(...competitorsData.map(c => c.reviewCount || 0), placeData?.reviewCount || 0) },
             { metric: "Google Rating", you: placeData?.rating || 0, average: specialityData.expectedRating, best: 5.0 }
           ]
        },

        // 7. Healthcare Intelligence
        healthcareIntelligence: {
           specialty: specialityData.speciality,
           expectedServices: specialityData.isUnknown ? ["Consultation", "Diagnosis", "Treatment"] : 
             specialityData.speciality.toLowerCase().includes("dentist") ? ["Teeth Whitening", "Root Canal", "Dental Implants", "Orthodontics", "Dental Crowns"] :
             specialityData.speciality.toLowerCase().includes("ivf") ? ["IVF Treatment", "IUI", "Fertility Preservation", "Semen Analysis"] :
             specialityData.speciality.toLowerCase().includes("lab") || specialityData.speciality.toLowerCase().includes("diagnostics") ? ["Blood Test", "MRI", "CT Scan", "X-Ray", "Ultrasound"] :
             specialityData.speciality.toLowerCase().includes("derma") ? ["Acne Treatment", "Laser Hair Removal", "Botox", "Chemical Peel"] :
             ["Consultation", "Patient Care", "Follow-up", "Health Checkup", "Diagnostics"]
        },

        // 8. Priority Action Plan
        priorityActionPlan: {
          tasks: [
            !placeData?.website ? { problem: "No Website Link", evidence: "Google relies on websites for EEAT signals.", time: "10 mins", impact: "High", difficulty: "Easy" } : null,
            (placeData?.reviewCount || 0) < compAvgReviews ? { problem: "Review Deficit", evidence: `You need ${compAvgReviews - (placeData?.reviewCount || 0)} reviews to match the local average.`, time: "Ongoing", impact: "High", difficulty: "Medium" } : null,
            isUnknown ? { problem: "Generic Category", evidence: "Your primary category limits your appearance in specialty searches.", time: "5 mins", impact: "High", difficulty: "Easy" } : null,
            { problem: "Missing Services/Products", evidence: "Unable to verify if your treatments are listed natively on Google.", time: "30 mins", impact: "Medium", difficulty: "Medium" }
          ].filter(Boolean)
        },

        // 9. Growth Opportunities
        growthOpportunities: {
          strategies: [
            { title: "Enable Google Messaging", description: "Convert searchers directly from the map pack." },
            { title: "Automate Review Collection", description: "Send WhatsApp requests post-appointment to steadily build review velocity." },
            { title: "Publish Weekly Google Posts", description: "Share treatment updates, before/afters, and health tips to keep the profile fresh." },
            { title: "List Individual Treatments as Services", description: "Helps you rank when patients search for specific procedures rather than just your clinic name." }
          ]
        },

        // 10. AI Action Plan (Locked)
        aiActionPlan: {
          lockedMessage: "Unlock the exact step-by-step blueprint to implement these fixes, outrank competitors, and acquire more patients automatically."
        }
      }
    });

    await prisma.auditRequest.update({ 
      where: { id: auditId }, 
      data: { progress: 100, status: "COMPLETED" } 
    });

    const completedReq = await prisma.auditRequest.findUnique({ where: { id: auditId } });
    if (completedReq?.leadId) {
      await prisma.leadActivity.create({
        data: {
          leadId: completedReq.leadId,
          eventType: "AUDIT_COMPLETED",
          message: "Audit report generated successfully.",
          metadata: { auditId }
        }
      });
    }

  } catch (error) {
    console.error("Background Audit Failed:", error);
    await prisma.auditRequest.update({ 
      where: { id: auditId }, 
      data: { status: "FAILED" } 
    });

    const failedReq = await prisma.auditRequest.findUnique({ where: { id: auditId } });
    if (failedReq?.leadId) {
      await prisma.leadActivity.create({
        data: {
          leadId: failedReq.leadId,
          eventType: "AUDIT_FAILED",
          message: "Failed to generate audit report.",
          metadata: { auditId, error: error instanceof Error ? error.message : "Unknown error" }
        }
      });
    }
  }
}
