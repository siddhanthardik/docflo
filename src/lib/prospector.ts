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

export class ProspectorService {
  /**
   * PHASE 1 — Fast discovery (returns in ~5–10s for 20 clinics).
   * Each clinic's audit is queued in the DB for background processing.
   */
  static async discoverClinics(params: {
    areaOrPincode: string;
    specialty: string;
    city?: string;
    country?: string;
    limit?: number;
  }): Promise<DiscoveredClinicLead[]> {
    const { areaOrPincode, specialty, city = "New Delhi", country = "India", limit = 10 } = params;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    console.log(`[PROSPECTOR] Searching: ${specialty} in ${areaOrPincode}, ${city}`);

    if (!apiKey) {
      throw new Error("GOOGLE_PLACES_API_KEY is required for clinic discovery.");
    }

    // ── STEP 1: Text search ─────────────────────────────────────────────────
    const searchQuery = `${specialty} in ${areaOrPincode} ${city} ${country}`;
    let rawPlaces: any[] = [];

    const placesRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const placesData = await placesRes.json();
    if (placesData.results && Array.isArray(placesData.results)) {
      rawPlaces = placesData.results;
    }

    if (rawPlaces.length === 0) {
      console.log(`[PROSPECTOR] No results for: ${searchQuery}`);
      return [];
    }

    const targetPlaces = rawPlaces.slice(0, Math.min(rawPlaces.length, limit));
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

    console.log(`[PROSPECTOR] Discovered ${leads.length} clinics. Audits queued for background processing.`);
    return leads;
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
