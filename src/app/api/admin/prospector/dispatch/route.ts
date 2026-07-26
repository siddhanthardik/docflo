import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { lead } = body;

    if (!lead || !lead.email) {
      return NextResponse.json({ error: "Valid lead with email required" }, { status: 400 });
    }

    const outreachDomainKey = process.env.OUTREACH_RESEND_API_KEY || process.env.RESEND_API_KEY;
    const outreachFromEmail = process.env.OUTREACH_FROM_EMAIL || "Gyrex Growth Engine <audit@getgyrex.com>";

    const subject = `Google Business Scan for ${lead.clinicName}: Estimated ${lead.estimatedPatientsLostMonthly} Monthly Patient Loss`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 24px; border-radius: 10px; text-align: center; margin-bottom: 24px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; tracking-tight: -0.5px;">Gyrex Local SEO Intelligence</h2>
          <p style="color: #818cf8; margin: 6px 0 0 0; font-size: 13px; font-weight: 600;">CONFIDENTIAL CLINIC GROWTH AUDIT REPORT</p>
        </div>

        <p style="font-size: 15px; color: #1e293b; line-height: 1.6;">Hello <strong>${lead.doctorName || "Doctor"}</strong>,</p>

        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Our AI Local SEO engine performed an automated Google Business Profile scan for <strong>${lead.clinicName}</strong> in <strong>${lead.city} (${lead.pincode})</strong>.
        </p>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 18px; border-radius: 10px; margin: 20px 0;">
          <div style="color: #991b1b; font-weight: bold; font-size: 15px; margin-bottom: 8px;">
            ⚠️ Local Visibility Score: ${lead.auditScore}/100
          </div>
          <p style="color: #7f1d1d; margin: 0; font-size: 13px; line-height: 1.5;">
            Your clinic is currently losing an estimated <strong>${lead.estimatedPatientsLostMonthly} patient inquiries every month</strong> due to missing keyword targeting, unreplied patient reviews, and unoptimized profile attributes.
          </p>
        </div>

        <div style="background-color: #f8fafc; padding: 18px; border-radius: 10px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 12px 0; font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">How Gyrex Clinic Growth Engine Fixes This</h4>
          <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.7;">
            <li><strong>AI Review Management:</strong> Responds to 100% of patient reviews in seconds with keyword injection.</li>
            <li><strong>Local SEO Intelligence:</strong> Ranks your clinic in top 3 Google Local Pack maps for nearby patients.</li>
            <li><strong>Automated WhatsApp Assistant:</strong> Converts web & profile leads into booked appointments 24/7.</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 28px 0 16px 0;">
          <a href="${lead.auditReportLink}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
            View Full Interactive Audit Report 📊
          </a>
        </div>

        <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 20px;">
          Gyrex Health Tech • Automated Growth Engine for Healthcare Professionals
        </p>
      </div>
    `;

    // Dispatch email via Resend Service using secondary outreach credentials
    const dispatchRes = await sendEmail({
      to: lead.email,
      subject,
      html,
      apiKey: outreachDomainKey,
      fromEmail: outreachFromEmail,
    });

    return NextResponse.json({
      success: true,
      message: `Outreach email successfully dispatched to ${lead.email} via secondary domain!`,
      dispatchRes,
    });
  } catch (error: any) {
    console.error("[PROSPECTOR DISPATCH ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch email" }, { status: 500 });
  }
}
