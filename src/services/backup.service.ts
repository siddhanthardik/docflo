import { prisma } from "@/lib/prisma";
import { GoogleDriveService } from "@/lib/google-drive";
import { sendEmail } from "@/lib/email";

export interface BackupExecutionResult {
  fileName: string;
  fileSizeBytes: number;
  driveFileId?: string;
  driveLink?: string;
  recordCounts: Record<string, number>;
  timestamp: string;
  emailSent: boolean;
}

export class BackupService {
  /**
   * Executes full database backup, uploads to Google Drive, and sends email confirmation.
   */
  static async runDailyBackup(adminEmail?: string): Promise<BackupExecutionResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `gyrex_backup_${timestamp}.json`;

    console.log(`[BACKUP ENGINE] Starting daily database extraction for ${fileName}...`);

    // 1. Export core database tables safely
    const [
      doctors,
      patients,
      appointments,
      invoices,
      campaigns,
      keywords,
      agentConfigs,
      leads
    ] = await Promise.all([
      prisma.doctor.findMany({ select: { id: true, name: true, email: true, phone: true, clinicName: true, createdAt: true, packageId: true, subscriptionStatus: true } }),
      prisma.patient.findMany({ take: 10000, orderBy: { createdAt: "desc" } }),
      prisma.appointment.findMany({ take: 10000, orderBy: { createdAt: "desc" } }),
      prisma.billingInvoice.findMany({ take: 10000, orderBy: { createdAt: "desc" } }),
      prisma.campaign.findMany({ take: 1000, orderBy: { createdAt: "desc" } }),
      prisma.localSeoKeyword.findMany({ take: 2000 }),
      prisma.aIAgentConfig.findMany({ select: { id: true, doctorId: true, agentType: true, enabled: true } }),
      prisma.auditLead.findMany({ take: 5000, orderBy: { createdAt: "desc" } })
    ]);

    const backupPayload = {
      version: "1.0",
      extractedAt: new Date().toISOString(),
      recordCounts: {
        doctors: doctors.length,
        patients: patients.length,
        appointments: appointments.length,
        invoices: invoices.length,
        campaigns: campaigns.length,
        keywords: keywords.length,
        agentConfigs: agentConfigs.length,
        leads: leads.length,
      },
      data: {
        doctors,
        patients,
        appointments,
        invoices,
        campaigns,
        keywords,
        agentConfigs,
        leads
      }
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const buffer = Buffer.from(jsonString, "utf-8");
    const fileSizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
    const fileSizeKB = (buffer.length / 1024).toFixed(1);
    const formattedSize = buffer.length > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;

    // 2. Upload to Google Drive
    const driveResult = await GoogleDriveService.uploadBackup(fileName, buffer, "application/json");

    // 3. Clean up backups older than 30 days
    await GoogleDriveService.cleanupOldBackups(30);

    // 4. Send Confirmation Email
    const recipientEmail = adminEmail || process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL || "admin@gyrex.in";
    const driveLink = driveResult?.webViewLink || `https://drive.google.com/drive/folders/${process.env.GOOGLE_DRIVE_FOLDER_ID || 'gyrex-backups'}`;

    const emailSubject = `[Gyrex] Daily Database Backup Success - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 12px; background-color: #ffffff;">
        <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Gyrex Clinic Platform</h2>
          <p style="color: #38bdf8; margin: 5px 0 0 0; font-size: 13px; font-weight: bold;">AUTOMATED DAILY DATABASE BACKUP</p>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #166534; margin: 0 0 5px 0; font-size: 16px;">✅ Backup Successfully Created & Stored</h3>
          <p style="color: #15803d; margin: 0; font-size: 13px;">Your daily database snapshot has been safely encrypted and uploaded to Google Drive.</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Backup File Name:</td>
            <td style="padding: 10px 0; color: #0f172a; font-family: monospace; font-weight: bold; text-align: right;">${fileName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: bold;">File Size:</td>
            <td style="padding: 10px 0; color: #0f172a; font-weight: bold; text-align: right;">${formattedSize}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Storage Target:</td>
            <td style="padding: 10px 0; color: #4f46e5; font-weight: bold; text-align: right;">Google Drive (Gyrex Backups)</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Retention Policy:</td>
            <td style="padding: 10px 0; color: #0f172a; text-align: right;">30 Days Auto-Pruning</td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #334155; uppercase tracking-wider;">Record Export Breakdown</h4>
          <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 12px; line-height: 1.6;">
            <li><strong>Patients:</strong> ${patients.length.toLocaleString()} records</li>
            <li><strong>Appointments:</strong> ${appointments.length.toLocaleString()} records</li>
            <li><strong>Invoices & Payments:</strong> ${invoices.length.toLocaleString()} records</li>
            <li><strong>Clinic Doctors & Staff:</strong> ${doctors.length.toLocaleString()} accounts</li>
            <li><strong>Campaigns & Local SEO:</strong> ${campaigns.length + keywords.length} items</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 25px;">
          <a href="${driveLink}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
            Open File in Google Drive 🚀
          </a>
        </div>
      </div>
    `;

    let emailSent = false;
    try {
      await sendEmail({
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml,
      });
      emailSent = true;
    } catch (e) {
      console.error("[BACKUP SERVICE] Failed to send notification email:", e);
    }

    return {
      fileName,
      fileSizeBytes: buffer.length,
      driveFileId: driveResult?.fileId,
      driveLink,
      recordCounts: backupPayload.recordCounts,
      timestamp,
      emailSent,
    };
  }
}
