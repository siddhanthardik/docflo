import { prisma } from "@/lib/prisma";
import { executeAuditScan } from "./audit-scan.service";
import { whatsappManager } from "@/lib/whatsapp-manager";

interface UserSession {
  state: "IDLE" | "AWAITING_CLINIC_NAME" | "AWAITING_DEMO_DETAILS" | "AWAITING_SUPPORT_MESSAGE";
  lastActivity: number;
  lastSearchedPlace?: any;
}

const userSessions = new Map<string, UserSession>();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export class PlatformWhatsAppConciergeService {
  /**
   * Search Google Places API or Nominatim for matching clinics
   */
  private static async searchClinicPlaces(input: string) {
    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (apiKey) {
      try {
        const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
        url.searchParams.set("input", input);
        url.searchParams.set("key", apiKey);
        url.searchParams.set("components", "country:in");

        const res = await fetch(url.toString(), {
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === "OK" && data.predictions?.length > 0) {
            return data.predictions.map((p: any) => ({
              placeId: p.place_id,
              name: p.structured_formatting?.main_text || p.description,
              address: p.structured_formatting?.secondary_text || "",
            }));
          }
        }
      } catch (err) {
        console.error("[Concierge] Google Places Search Error:", err);
      }
    }

    // Fallback: Nominatim OpenStreetMap search
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", input);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "5");
      url.searchParams.set("countrycodes", "in");

      const res = await fetch(url.toString(), {
        headers: {
          "User-Agent": "Gyrex/1.0 (healthcare-platform; contact@gyrex.in)",
          "Accept-Language": "en",
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item: any) => ({
            placeId: item.place_id?.toString() || item.osm_id?.toString(),
            name: item.name || item.display_name?.split(",")[0] || input,
            address: item.display_name || "India",
          }));
        }
      }
    } catch (err) {
      console.error("[Concierge] Nominatim Search Error:", err);
    }

    return [];
  }

  /**
   * Main Entrypoint for incoming WhatsApp messages to Super Admin
   */
  public static async handleIncomingMessage(
    senderPhone: string,
    messageText: string,
    socketDoctorId: string = "PLATFORM_SUPERADMIN"
  ) {
    const rawText = (messageText || "").trim();
    const textLower = rawText.toLowerCase();
    const waManager = whatsappManager;

    // 1. Manage User Session
    let session = userSessions.get(senderPhone);
    const now = Date.now();
    if (!session || now - session.lastActivity > SESSION_TTL_MS) {
      session = { state: "IDLE", lastActivity: now };
      userSessions.set(senderPhone, session);
    } else {
      session.lastActivity = now;
    }

    // 2. Greeting / Menu Trigger Check
    const isGreeting =
      ["hi", "hello", "hey", "menu", "help", "start", "namaste", "options", "hola"].includes(
        textLower
      ) || rawText === "0";

    if (isGreeting && session.state === "IDLE") {
      await this.sendMainMenu(senderPhone, waManager, socketDoctorId);
      return;
    }

    // 3. Option 1: Free Audit Trigger
    if (textLower === "1" || textLower === "audit" || textLower.startsWith("free audit")) {
      session.state = "AWAITING_CLINIC_NAME";
      userSessions.set(senderPhone, session);

      const promptMsg =
        `🏥 *Free 60-Second Google Visibility & Competitor Audit*\n\n` +
        `Please reply with your:\n` +
        `👉 *Clinic / Hospital Name & City/Area*\n\n` +
        `_Example:_\n` +
        `• \`Apollo Dental Clinic, Indiranagar Bangalore\`\n` +
        `• \`Max Healthcare Saket New Delhi\`\n\n` +
        `⚡ We will immediately scan your live Google Maps profile and calculate competitor benchmarks!`;

      await waManager.sendMessage(socketDoctorId, senderPhone, promptMsg);
      return;
    }

    // 4. Option 2: Sales, Demo & Consultation Inquiry
    if (
      textLower === "2" ||
      textLower === "sales" ||
      textLower === "demo" ||
      textLower === "pricing" ||
      textLower === "talk" ||
      textLower === "consultation" ||
      textLower === "expert"
    ) {
      session.state = "AWAITING_DEMO_DETAILS";
      userSessions.set(senderPhone, session);

      // Record Sales Lead in CRM
      try {
        const lead = await prisma.auditLead.upsert({
          where: {
            phone_placeId: {
              phone: senderPhone,
              placeId: "WHATSAPP_SALES_INQUIRY",
            },
          },
          update: {
            updatedAt: new Date(),
            status: "CONTACTED",
          },
          create: {
            name: `WhatsApp Prospect (+${senderPhone})`,
            phone: senderPhone,
            placeId: "WHATSAPP_SALES_INQUIRY",
            leadSource: "WHATSAPP_SALES",
            landingPage: "WhatsApp Super Admin",
            status: "NEW",
          },
        });

        await prisma.leadActivity.create({
          data: {
            leadId: lead.id,
            eventType: "SALES_INQUIRY",
            message: `User initiated Sales / Consultation flow on WhatsApp: "${rawText}"`,
            metadata: { message: rawText, phone: senderPhone },
          },
        });
      } catch (e) {
        console.error("[Concierge] Failed to log sales lead:", e);
      }

      const salesMsg =
        `🚀 *Gyrex Clinic Growth & Practice Automation*\n\n` +
        `We help healthcare clinics and doctors:\n` +
        `✅ Attract 3x more local patients from Google Maps\n` +
        `✅ Collect 5-star Google reviews automatically on WhatsApp\n` +
        `✅ Zero no-shows with automated WhatsApp appointment reminders\n` +
        `✅ 24/7 AI Medical Assistant to answer patient queries\n\n` +
        `📅 *Book a 1-on-1 Consultation with our Expert Team:*\n` +
        `Please reply with your *Name* and *Preferred Timing* (e.g., _"Dr. Siddhant, Tomorrow 3 PM"_).\n\n` +
        `🌐 Explore features & pricing: https://gyrex.in/pricing\n\n` +
        `Our Growth Specialist will connect with you at your preferred time!`;

      await waManager.sendMessage(socketDoctorId, senderPhone, salesMsg);
      return;
    }

    // 5. Option 3: Doctor & Clinic Support
    if (textLower === "3" || textLower === "support") {
      session.state = "AWAITING_SUPPORT_MESSAGE";
      userSessions.set(senderPhone, session);

      const supportMsg =
        `🛠️ *Gyrex Doctor & Clinic Support Desk*\n\n` +
        `Please reply with your question or issue description below.\n\n` +
        `Our support engineering team will review and assist you right away.\n\n` +
        `📧 Email: support@gyrex.in\n` +
        `🌐 Help Center: https://gyrex.in/contact`;

      await waManager.sendMessage(socketDoctorId, senderPhone, supportMsg);
      return;
    }

    // 6. Option 4: Check Existing Audit Status
    if (textLower === "4" || textLower === "status") {
      session.state = "IDLE";
      userSessions.set(senderPhone, session);

      try {
        const lead = await prisma.auditLead.findFirst({
          where: { phone: senderPhone },
          include: {
            requests: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { report: true },
            },
          },
        });

        const latestReq = lead?.requests[0];
        if (latestReq && latestReq.report) {
          const statusMsg =
            `📋 *Your Latest Google Visibility Audit Report*\n\n` +
            `🏥 *Clinic:* ${latestReq.report.businessName}\n` +
            `⭐ *Rating:* ${latestReq.report.rating || "N/A"}★ (${latestReq.report.reviewCount || 0} reviews)\n` +
            `📅 *Date:* ${latestReq.createdAt.toLocaleDateString("en-IN")}\n\n` +
            `📄 *View Full 10-Section Diagnostic Report:* \n` +
            `👉 https://gyrex.in/local-seo/free-audit/report/${latestReq.id}\n\n` +
            `💡 Reply *1* to run a new audit or *2* to speak with our Growth Specialist.`;

          await waManager.sendMessage(socketDoctorId, senderPhone, statusMsg);
          return;
        } else {
          const noAuditMsg =
            `ℹ️ No prior audit found for phone number *+${senderPhone}*.\n\n` +
            `🏥 Reply *1* or send your *Clinic Name & City* to generate a Free 60-Second Audit now!`;

          await waManager.sendMessage(socketDoctorId, senderPhone, noAuditMsg);
          return;
        }
      } catch (err) {
        console.error("[Concierge] Status check error:", err);
      }
    }

    // 7. If awaiting Demo / Consultation Details
    if (session.state === "AWAITING_DEMO_DETAILS") {
      session.state = "IDLE";
      userSessions.set(senderPhone, session);

      let prospectName = rawText;
      let requestedTime = rawText;

      const commaSplit = rawText.split(/,|\bat\b|\bon\b/i);
      if (commaSplit.length >= 2) {
        prospectName = commaSplit[0].trim();
        requestedTime = commaSplit.slice(1).join(" ").trim();
      }

      try {
        const lead = await prisma.auditLead.upsert({
          where: {
            phone_placeId: {
              phone: senderPhone,
              placeId: "WHATSAPP_SALES_INQUIRY",
            },
          },
          update: {
            name: prospectName || undefined,
            status: "CONTACTED",
            updatedAt: new Date(),
          },
          create: {
            name: prospectName || `WhatsApp Prospect (+${senderPhone})`,
            phone: senderPhone,
            placeId: "WHATSAPP_SALES_INQUIRY",
            leadSource: "WHATSAPP_SALES",
            landingPage: "WhatsApp Super Admin",
            status: "NEW",
          },
        });

        await prisma.leadActivity.create({
          data: {
            leadId: lead.id,
            eventType: "CONSULTATION_REQUESTED",
            message: `Consultation Requested: "${rawText}" (Contact: ${prospectName}, Time: ${requestedTime})`,
            metadata: {
              rawMessage: rawText,
              prospectName,
              requestedTime,
              phone: senderPhone,
            },
          },
        });
      } catch (e) {
        console.error("[Concierge] Failed to log consultation request:", e);
      }

      const confirmMsg =
        `✅ *Consultation Request Confirmed!*\n\n` +
        `Thank you! We have received your consultation details:\n` +
        `👤 *Contact:* ${prospectName}\n` +
        `📅 *Requested Timing:* ${requestedTime}\n` +
        `📞 *Phone:* +${senderPhone}\n\n` +
        `Our Clinic Growth Specialist has been assigned and will connect with you at the scheduled time.\n\n` +
        `💡 Want to run a free clinic audit while you wait? Reply *1* or send your *Clinic Name & City* anytime!`;

      await waManager.sendMessage(socketDoctorId, senderPhone, confirmMsg);
      return;
    }

    // 8. If awaiting Support Message
    if (session.state === "AWAITING_SUPPORT_MESSAGE") {
      session.state = "IDLE";
      userSessions.set(senderPhone, session);

      try {
        const lead = await prisma.auditLead.upsert({
          where: {
            phone_placeId: {
              phone: senderPhone,
              placeId: "WHATSAPP_SUPPORT_TICKET",
            },
          },
          update: { updatedAt: new Date() },
          create: {
            name: `Support Contact (+${senderPhone})`,
            phone: senderPhone,
            placeId: "WHATSAPP_SUPPORT_TICKET",
            leadSource: "WHATSAPP_SUPPORT",
            landingPage: "WhatsApp Super Admin",
            status: "NEW",
          },
        });

        await prisma.leadActivity.create({
          data: {
            leadId: lead.id,
            eventType: "SUPPORT_TICKET",
            message: `Support Query received: "${rawText}"`,
            metadata: { query: rawText, phone: senderPhone },
          },
        });
      } catch (e) {
        console.error("[Concierge] Failed to log support ticket:", e);
      }

      const ackMsg =
        `✅ *Support Request Logged!*\n\n` +
        `Thank you for reaching out. We have logged your query:\n` +
        `_"${rawText}"_\n\n` +
        `Our technical support team has been notified and will assist you shortly.`;

      await waManager.sendMessage(socketDoctorId, senderPhone, ackMsg);
      return;
    }

    // 9. Process Clinic Audit Request (Strict Check: Either State === AWAITING_CLINIC_NAME or explicit healthcare keywords)
    const hasHealthcareKeyword =
      textLower.includes("clinic") ||
      textLower.includes("hospital") ||
      textLower.includes("dental") ||
      textLower.includes("dentist") ||
      textLower.includes("dr.") ||
      textLower.includes("dr ") ||
      textLower.includes("doctor") ||
      textLower.includes("skin") ||
      textLower.includes("derma") ||
      textLower.includes("eye") ||
      textLower.includes("ortho") ||
      textLower.includes("health") ||
      textLower.includes("care") ||
      textLower.includes("ivf") ||
      textLower.includes("ayurved") ||
      textLower.includes("homeopath") ||
      textLower.startsWith("audit for") ||
      textLower.startsWith("scan clinic") ||
      textLower.startsWith("check clinic");

    const looksLikeClinicSearch =
      session.state === "AWAITING_CLINIC_NAME" ||
      (hasHealthcareKeyword && !isGreeting);

    if (looksLikeClinicSearch) {
      session.state = "IDLE";
      userSessions.set(senderPhone, session);

      // Clean query
      const cleanedQuery = rawText
        .replace(/^audit\s+for\s+/i, "")
        .replace(/^check\s+my\s+clinic\s+/i, "")
        .replace(/^generate\s+audit\s+for\s+/i, "")
        .replace(/^scan\s+clinic\s+/i, "")
        .trim();

      await this.runWhatsAppClinicAudit(senderPhone, cleanedQuery, waManager, socketDoctorId);
      return;
    }

    // Default Fallback: Send Main Menu
    await this.sendMainMenu(senderPhone, waManager, socketDoctorId);
  }

  /**
   * Dispatches the Main Interactive Menu
   */
  private static async sendMainMenu(
    senderPhone: string,
    waManager: typeof whatsappManager,
    socketDoctorId: string
  ) {
    const menuMsg =
      `👋 *Welcome to Gyrex Healthcare Platform!*\n` +
      `Your AI-powered Clinic Growth & Practice Management Assistant.\n\n` +
      `How can we help you today? Please reply with a number (*1*, *2*, *3*, or *4*):\n\n` +
      `1️⃣ *Free Google Business & SEO Audit* (Instant 60s Report)\n` +
      `2️⃣ *Book a 1-on-1 Growth Demo / Consultation*\n` +
      `3️⃣ *Doctor & Clinic Support Desk*\n` +
      `4️⃣ *Check Existing Audit Status*\n\n` +
      `💡 _You can also type your clinic name & city directly anytime to run an instant Google audit!_`;

    await waManager.sendMessage(socketDoctorId, senderPhone, menuMsg);
  }

  /**
   * Executes the full Google Places search, AuditLead creation, and AuditScan execution
   */
  private static async runWhatsAppClinicAudit(
    senderPhone: string,
    clinicQuery: string,
    waManager: typeof whatsappManager,
    socketDoctorId: string
  ) {
    // 1. Search Google Places
    const matches = await this.searchClinicPlaces(clinicQuery);

    if (matches.length === 0) {
      const notFoundMsg =
        `⚠️ We couldn't find a matching clinic on Google Maps for *"${clinicQuery}"*.\n\n` +
        `Please reply with your full clinic name and area/city (e.g. \`Care Dental Clinic, Bandra West, Mumbai\`) so we can find your exact listing.`;

      await waManager.sendMessage(socketDoctorId, senderPhone, notFoundMsg);
      return;
    }

    const bestMatch = matches[0];

    // 2. Create or Update Lead in Super Admin CRM
    let lead;
    try {
      lead = await prisma.auditLead.upsert({
        where: {
          phone_placeId: {
            phone: senderPhone,
            placeId: bestMatch.placeId,
          },
        },
        update: {
          clinicName: bestMatch.name,
          updatedAt: new Date(),
        },
        create: {
          name: `Dr. / Clinic Owner (+${senderPhone})`,
          phone: senderPhone,
          clinicName: bestMatch.name,
          placeId: bestMatch.placeId,
          leadSource: "WHATSAPP_AUDIT_BOT",
          landingPage: "WhatsApp Super Admin",
          status: "NEW",
        },
      });
    } catch (err) {
      lead = await prisma.auditLead.findFirst({
        where: { phone: senderPhone },
      });
      if (!lead) {
        lead = await prisma.auditLead.create({
          data: {
            name: `Dr. / Clinic Owner (+${senderPhone})`,
            phone: senderPhone,
            clinicName: bestMatch.name,
            placeId: bestMatch.placeId,
            leadSource: "WHATSAPP_AUDIT_BOT",
            landingPage: "WhatsApp Super Admin",
            status: "NEW",
          },
        });
      }
    }

    // 3. Create AuditRequest linked to Lead
    const auditRequest = await prisma.auditRequest.create({
      data: {
        leadId: lead.id,
        placeId: bestMatch.placeId,
        searchQuery: `${bestMatch.name} ${bestMatch.address}`,
        status: "SCANNING",
        progress: 10,
      },
    });

    // 4. Log Activity in Super Admin CRM
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        eventType: "AUDIT_STARTED",
        message: `WhatsApp GBP audit initiated for ${bestMatch.name}.`,
        metadata: { auditId: auditRequest.id, placeId: bestMatch.placeId },
      },
    });

    // 5. Send Immediate Progress Message
    const progressMsg =
      `⏳ *Scanning Google Maps for:*\n` +
      `🏥 *${bestMatch.name}*\n` +
      `📍 _${bestMatch.address || "Local Area"}_\n\n` +
      `🔍 *Analyzing in real-time:*\n` +
      `• Google Maps Rank in 5 km radius\n` +
      `• Rating & Review Deficit vs Competitors\n` +
      `• Primary & Secondary Medical Categories\n` +
      `• Profile Completeness & EEAT Signals\n\n` +
      `⚡ Compiling your diagnostic report now... Please hold on!`;

    await waManager.sendMessage(socketDoctorId, senderPhone, progressMsg);

    // 6. Execute Audit Scan
    try {
      const scanResult = await executeAuditScan(auditRequest.id, {
        placeId: bestMatch.placeId,
        name: bestMatch.name,
        address: bestMatch.address,
        searchQuery: clinicQuery,
      });

      const rating = scanResult.placeData?.rating || "N/A";
      const reviews = scanResult.placeData?.reviewCount || 0;
      const rank = scanResult.userRank > 20 ? "20+" : `#${scanResult.userRank}`;
      const score = scanResult.overallScore || 70;
      const compAvg = scanResult.compAvgReviews || 100;
      const reviewDeficit = Math.max(0, compAvg - Number(reviews));

      // Extract key issues for WhatsApp summary
      const issues = [];
      if (reviewDeficit > 0) {
        issues.push(`• *Review Deficit:* You are ${reviewDeficit} reviews behind nearby competitor clinics.`);
      }
      if (!scanResult.placeData?.website) {
        issues.push(`• *Missing Website Link:* No official website linked on Google Maps.`);
      }
      if ((scanResult.placeData?.types?.length || 0) <= 2) {
        issues.push(`• *Category Optimization:* Missing secondary medical categories to capture search traffic.`);
      }
      if (!scanResult.placeData?.hasOpeningHours) {
        issues.push(`• *Missing Hours:* Business hours not configured on Google Maps.`);
      }
      if (issues.length === 0) {
        issues.push(`• *Map Pack Visibility:* Can be improved with weekly Google Posts & verified patient review flow.`);
      }

      // 7. Send Formatted Final Audit Report to WhatsApp
      const reportMsg =
        `📊 *Google Visibility Audit Report*\n` +
        `🏥 *${bestMatch.name}*\n\n` +
        `⭐ *Google Rating:* ${rating}★ (${reviews} Reviews)\n` +
        `📍 *Local Competitor Rank:* ${rank} (in 5 km radius)\n` +
        `🎯 *Profile Optimization Score:* ${score}/100\n\n` +
        `🚨 *Key Findings & Action Items:*\n` +
        `${issues.join("\n")}\n\n` +
        `📄 *View Your Complete 10-Section Diagnostic Report & Competitor Breakdown:* \n` +
        `👉 https://gyrex.in/local-seo/free-audit/report/${auditRequest.id}\n\n` +
        `💡 Want to fix these issues and rank #1 on Google Maps? Reply *2* or *TALK* to speak with our Clinic Growth Consultant.`;

      await waManager.sendMessage(socketDoctorId, senderPhone, reportMsg);
    } catch (err: any) {
      console.error("[Concierge] Audit execution failed:", err);

      const errorMsg =
        `⚠️ We encountered an issue compiling the full competitor benchmark for *${bestMatch.name}*.\n\n` +
        `Our team has been notified. You can also view our web diagnostic tool at https://gyrex.in/audit or reply *2* to speak with a specialist.`;

      await waManager.sendMessage(socketDoctorId, senderPhone, errorMsg);
    }
  }
}
