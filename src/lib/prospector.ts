/**
 * AI Sales Agent & Clinic Prospecting Engine for Gyrex SuperAdmin
 *
 * Architecture — Two-Phase:
 *   Phase 1 (sync / fast):  Google Places TextSearch → parallel Place Details
 *                           → fast email scrape (2s timeout) → DB upsert → respond
 *   Phase 2 (async / bg):  AuditRequest rows with status=PENDING are picked up by
 *                           the background cron (/api/cron/audit-queue) which calls
 *                           executeAuditScan and updates the report link.
 *
 * This guarantees the HTTP response always returns within a few seconds,
 * regardless of how many clinics are requested.
 */

import { prisma } from "@/lib/prisma";
import { detectSpeciality } from "@/lib/audit/healthcare-intelligence";

export interface DiscoveredClinicLead {
  id: string;
  clinicName: string;
  doctorName?: string;
  specialty: string;
  address: string;
  city: string;
  pincode: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  googlePlaceId?: string;
  gmbUrl?: string;
  rating?: number;
  userRatingsTotal?: number;
  auditScore: number;
  estimatedPatientsLostMonthly: number;
  auditReportLink: string;
  auditStatus: "QUEUED" | "PROCESSING" | "COMPLETE" | "FAILED";
  status: "DISCOVERED" | "EMAIL_FOUND" | "AUDIT_GENERATED" | "SYNCED" | "DISPATCHED";
  createdAt: string;
}

export interface ProspectorDiscoveryMeta {
  batch: number;
  totalDiscoveredThisRun: number;
  skippedExistingCount: number;
  hasMore: boolean;
  totalFreshAvailable: number;
}

export interface DiscoveryResult {
  leads: DiscoveredClinicLead[];
  meta: ProspectorDiscoveryMeta;
}

export class ProspectorService {
  /**
   * PHASE 1 — Fast discovery (returns in ~5–10s for 20 clinics).
   * Supports automatic database deduplication, batch pagination, and Google next_page_token traversal.
   */
  static async discoverClinics(params: {
    areaOrPincode: string;
    specialty: string;
    city?: string;
    country?: string;
    limit?: number;
    batch?: number;
    excludeExisting?: boolean;
    excludePlaceIds?: string[];
  }): Promise<DiscoveryResult> {
    const {
      areaOrPincode,
      specialty,
      city = "New Delhi",
      country = "India",
      limit = 10,
      batch = 1,
      excludeExisting = true,
      excludePlaceIds = [],
    } = params;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    console.log(`[PROSPECTOR] Searching: ${specialty} in ${areaOrPincode}, ${city} (Batch: ${batch}, Limit: ${limit}, ExcludeExisting: ${excludeExisting})`);

    if (!apiKey) {
      throw new Error("GOOGLE_PLACES_API_KEY is required for clinic discovery.");
    }

    // ── STEP 1: Text search ─────────────────────────────────────────────────
    const searchQuery = `${specialty} in ${areaOrPincode} ${city} ${country}`;
    let rawPlaces: any[] = [];
    let nextPageToken: string | null = null;

    try {
      const placesRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`,
        { signal: AbortSignal.timeout(8000) }
      );
      const placesData = await placesRes.json();
      if (placesData.results && Array.isArray(placesData.results)) {
        rawPlaces = placesData.results;
        nextPageToken = placesData.next_page_token || null;
      }
    } catch (fetchErr) {
      console.error("[PROSPECTOR] Failed to fetch Google Places:", fetchErr);
    }

    if (rawPlaces.length === 0) {
      console.log(`[PROSPECTOR] No results for: ${searchQuery}`);
      return {
        leads: [],
        meta: {
          batch,
          totalDiscoveredThisRun: 0,
          skippedExistingCount: 0,
          hasMore: false,
          totalFreshAvailable: 0,
        },
      };
    }

    // ── STEP 1.5: Query existing DB leads to deduplicate ─────────────────────
    const existingPlaceIdSet = new Set<string>();

    if (excludeExisting) {
      try {
        const existingLeads = await prisma.auditLead.findMany({
          where: {
            placeId: { not: null },
          },
          select: { placeId: true },
        });
        for (const lead of existingLeads) {
          if (lead.placeId) {
            existingPlaceIdSet.add(lead.placeId);
          }
        }
      } catch (dbErr) {
        console.warn("[PROSPECTOR] Could not query existing audit leads for deduplication:", dbErr);
      }
    }

    // Add any placeIds passed explicitly by client
    if (Array.isArray(excludePlaceIds)) {
      for (const id of excludePlaceIds) {
        if (id) existingPlaceIdSet.add(id);
      }
    }

    // Filter fresh places not already discovered in Gyrex DB
    let freshPlaces = excludeExisting
      ? rawPlaces.filter((item) => !item.place_id || !existingPlaceIdSet.has(item.place_id))
      : rawPlaces;

    const skippedCount = rawPlaces.length - freshPlaces.length;

    // If fresh places on page 1 are fewer than requested limit, and Google has next_page_token:
    if (freshPlaces.length < limit && nextPageToken) {
      try {
        console.log(`[PROSPECTOR] Fresh places on page 1 (${freshPlaces.length}) < limit (${limit}). Fetching page 2 via next_page_token...`);
        // Mandatory Google Places 2-second activation delay for next_page_token
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const page2Res = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${apiKey}`,
          { signal: AbortSignal.timeout(8000) }
        );
        const page2Data = await page2Res.json();
        if (page2Data.results && Array.isArray(page2Data.results)) {
          nextPageToken = page2Data.next_page_token || null;
          const page2Fresh = excludeExisting
            ? page2Data.results.filter((item: any) => !item.place_id || !existingPlaceIdSet.has(item.place_id))
            : page2Data.results;
          freshPlaces.push(...page2Fresh);
        }
      } catch (tokenErr) {
        console.warn("[PROSPECTOR] Failed fetching page 2 of Google Places:", tokenErr);
      }
    }

    // Slicing:
    // If excludeExisting is true, freshPlaces already excludes past leads, so we take the top `limit` fresh items.
    // If excludeExisting is false, we use standard pagination offset: (batch - 1) * limit.
    const startIndex = excludeExisting ? 0 : Math.max(0, (batch - 1) * limit);
    const targetPlaces = freshPlaces.slice(startIndex, startIndex + limit);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://gyrex.in";

    // ── STEP 2: Parallel Place Details (all clinics at once) ─────────────────
    const detailsResults = await Promise.allSettled(
      targetPlaces.map((item) =>
        item.place_id
          ? fetch(
              `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&fields=name,geometry,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,types,url&key=${apiKey}`,
              { signal: AbortSignal.timeout(5000) }
            )
              .then((r) => r.json())
              .catch(() => null)
          : Promise.resolve(null)
      )
    );

    // ── STEP 3: Parallel email scrapes with hard 2s timeout each ────────────
    const emailResults = await Promise.allSettled(
      targetPlaces.map((item, idx) => {
        const details = detailsResults[idx].status === "fulfilled" ? (detailsResults[idx] as any).value?.result : null;
        const website = details?.website || "";
        return this.scrapeEmailFromWebsite(website);
      })
    );

    // ── STEP 4: Upsert DB records + queue audits, build lead list ────────────
    const leads: DiscoveredClinicLead[] = [];

    for (let i = 0; i < targetPlaces.length; i++) {
      const item = targetPlaces[i];
      const placeId = item.place_id || `PLACE_${Date.now()}_${i}`;
      const clinicName = item.name || "Clinic";
      const address = item.formatted_address || `${areaOrPincode}, ${city}`;

      const detailsRaw = detailsResults[i].status === "fulfilled" ? (detailsResults[i] as any).value?.result : null;
      const officialPhone = detailsRaw?.formatted_phone_number || detailsRaw?.international_phone_number || "";
      const officialWebsite = detailsRaw?.website || "";
      const officialGmbUrl = detailsRaw?.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`;
      const rating = detailsRaw?.rating || item.rating || 0;
      const userRatingsTotal = detailsRaw?.user_ratings_total || item.user_ratings_total || 0;

      const officialEmail = emailResults[i].status === "fulfilled" ? (emailResults[i] as any).value || "" : "";
      const doctorName = this.extractDoctorName(clinicName);
      const safePhone = officialPhone || `UNLISTED_${Date.now()}_${i}`;

      // Estimated score before real audit (placeholder shown until bg audit completes)
      const estimatedScore = Math.min(85, 40 + Math.floor(rating * 5) + (userRatingsTotal > 50 ? 10 : 0));
      const estimatedPatientsLost = Math.max(8, Math.floor((100 - estimatedScore) * 0.35));

      let auditRequestId = "";
      let auditReportId = "";

      try {
        // Upsert AuditLead
        const leadRecord = await prisma.auditLead.upsert({
          where: { phone_placeId: { phone: safePhone, placeId } },
          update: {
            name: doctorName || clinicName,
            clinicName,
            email: officialEmail || undefined,
            updatedAt: new Date(),
          },
          create: {
            name: doctorName || clinicName,
            clinicName,
            phone: safePhone,
            email: officialEmail || undefined,
            placeId,
            status: "NEW",
            leadSource: "AI_PROSPECTOR_AGENT",
          },
        });

        // Queue audit request (status=PENDING — picked up by background cron)
        const auditReq = await prisma.auditRequest.create({
          data: {
            leadId: leadRecord.id,
            placeId,
            searchQuery: `${specialty} in ${areaOrPincode}, ${city}`,
            status: "PENDING",
            progress: 0,
          },
        });

        auditRequestId = auditReq.id;
        auditReportId = auditReq.id; // report will be created when bg job runs
      } catch (dbErr) {
        console.error(`[PROSPECTOR DB] Error for ${clinicName}:`, dbErr);
        auditReportId = `lead_${Date.now()}_${i}`;
      }

      leads.push({
        id: auditReportId,
        clinicName,
        doctorName,
        specialty,
        address,
        city,
        pincode: areaOrPincode,
        country,
        phone: officialPhone,
        email: officialEmail,
        website: officialWebsite,
        googlePlaceId: placeId,
        gmbUrl: officialGmbUrl,
        rating,
        userRatingsTotal,
        auditScore: estimatedScore,
        estimatedPatientsLostMonthly: estimatedPatientsLost,
        auditReportLink: `${baseUrl}/local-seo/free-audit/report/${auditReportId}`,
        auditStatus: "QUEUED",
        status: officialEmail ? "EMAIL_FOUND" : "DISCOVERED",
        createdAt: new Date().toISOString(),
      });
    }

    console.log(`[PROSPECTOR] Discovered ${leads.length} clinics (Skipped ${skippedCount} existing). Audits queued.`);
    return {
      leads,
      meta: {
        batch,
        totalDiscoveredThisRun: leads.length,
        skippedExistingCount: skippedCount,
        hasMore: freshPlaces.length > (startIndex + limit) || !!nextPageToken,
        totalFreshAvailable: freshPlaces.length,
      },
    };
  }

  /**
   * PHASE 2 helper — called by background cron to run real audits on PENDING requests.
   * Each call processes one AuditRequest and updates its status + report.
   */
  static async processQueuedAudit(auditRequestId: string): Promise<void> {
    // Import lazily to avoid circular dependency issues at module load time
    const { executeAuditScan } = await import("@/services/audit-scan.service");

    const auditReq = await prisma.auditRequest.findUnique({
      where: { id: auditRequestId },
      include: { lead: true },
    });

    if (!auditReq || auditReq.status !== "PENDING") return;

    try {
      await prisma.auditRequest.update({
        where: { id: auditRequestId },
        data: { status: "PROCESSING", progress: 10 },
      });

      await executeAuditScan(auditRequestId, {
        placeId: auditReq.placeId,
        name: auditReq.lead?.clinicName || "Clinic",
        address: auditReq.lead?.name || "",
        searchQuery: auditReq.searchQuery,
      });
    } catch (err) {
      console.error(`[PROSPECTOR BG AUDIT] Failed for request ${auditRequestId}:`, err);
      await prisma.auditRequest.update({
        where: { id: auditRequestId },
        data: { status: "FAILED", progress: 0 },
      }).catch(() => {});
    }
  }

  /**
   * Fast email scraper — 2s timeout, single URL only (no retry chain in hot path).
   */
  private static async scrapeEmailFromWebsite(websiteUrl?: string): Promise<string> {
    if (!websiteUrl || !websiteUrl.startsWith("http")) return "";

    const invalidDomains = ["sentry.io", "wixpress.com", "bootstrap.com", "wordpress.org", "schema.org", "google.com"];

    try {
      const res = await fetch(websiteUrl, {
        signal: AbortSignal.timeout(2000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; GyrexBot/1.0)" },
      });
      if (!res.ok) return "";
      const html = await res.text();
      const matches = html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
      if (matches) {
        for (const raw of matches) {
          const clean = raw.toLowerCase().trim();
          const domain = clean.split("@")[1] || "";
          if (
            !clean.endsWith(".png") && !clean.endsWith(".jpg") &&
            !clean.endsWith(".svg") && !clean.endsWith(".webp") &&
            !invalidDomains.some((inv) => domain.includes(inv))
          ) {
            return clean;
          }
        }
      }
    } catch {
      // Timeout or network error — return empty, non-blocking
    }

    return "";
  }

  private static extractDoctorName(clinicName: string): string {
    if (clinicName.toLowerCase().includes("dr.")) {
      const parts = clinicName.split(" ");
      const drIdx = parts.findIndex((p) => p.toLowerCase().includes("dr."));
      if (drIdx !== -1 && parts[drIdx + 1]) {
        return `${parts[drIdx]} ${parts[drIdx + 1]}`;
      }
    }
    return "";
  }
}
