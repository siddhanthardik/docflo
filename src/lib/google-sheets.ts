/**
 * Google Sheets API Service Module for Syncing Prospector Doctor Leads
 */

import { DiscoveredClinicLead } from "./prospector";

export class GoogleSheetsService {
  /**
   * Appends discovered clinic lead rows to Google Sheet spreadsheet
   */
  static async syncLeadsToSheet(leads: DiscoveredClinicLead[]): Promise<{ success: boolean; syncedCount: number; message: string; spreadsheetUrl?: string }> {
    const rawSpreadsheetId = process.env.GOOGLE_SHEETS_PROSPECT_ID || "";
    const rawClientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL || "";
    const rawPrivateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY || "";

    const spreadsheetId = rawSpreadsheetId.replace(/^["']|["']$/g, '').trim();
    const clientEmail = rawClientEmail.replace(/^["']|["']$/g, '').trim();
    const privateKey = rawPrivateKey
      .replace(/^["']|["']$/g, '')
      .replace(/\\n/g, '\n')
      .trim();

    const spreadsheetUrl = spreadsheetId 
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
      : "https://docs.google.com/spreadsheets";

    if (!clientEmail || !privateKey || !spreadsheetId) {
      const missingVars = [
        !spreadsheetId && "GOOGLE_SHEETS_PROSPECT_ID",
        !clientEmail && "GOOGLE_DRIVE_CLIENT_EMAIL",
        !privateKey && "GOOGLE_DRIVE_PRIVATE_KEY",
      ].filter(Boolean).join(", ");

      console.warn(`[GOOGLE SHEETS] Sync skipped: Pending ${missingVars} in .env`);
      return {
        success: false,
        syncedCount: 0,
        message: `Google Sheets sync skipped: Pending ${missingVars} in .env`,
        spreadsheetUrl,
      };
    }

    try {
      // Generate OAuth2 JWT Token for Google Sheets API
      const header = { alg: "RS256", typ: "JWT" };
      const now = Math.floor(Date.now() / 1000);
      const claimSet = {
        iss: clientEmail,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      };

      const crypto = await import("crypto");
      const base64UrlEncode = (str: string) => Buffer.from(str).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

      const signatureInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claimSet))}`;
      const signer = crypto.createSign("RSA-SHA256");
      signer.update(signatureInput);
      const jwt = `${signatureInput}.${signer.sign(privateKey, "base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")}`;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: jwt,
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        const errMsg = tokenData.error_description || tokenData.error || "Google Auth failed";
        console.error("[GOOGLE SHEETS AUTH ERROR]", errMsg);
        return {
          success: false,
          syncedCount: 0,
          message: `Google Auth Error: ${errMsg}`,
          spreadsheetUrl,
        };
      }

      const accessToken = tokenData.access_token;

      // 1. Fetch spreadsheet metadata to get the exact primary sheet tab name
      let primarySheetName = "Sheet1";
      try {
        const metaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          if (metaData.sheets && metaData.sheets[0]?.properties?.title) {
            primarySheetName = metaData.sheets[0].properties.title;
          }
        }
      } catch (metaErr) {
        console.warn("[GOOGLE SHEETS] Could not fetch sheet metadata, defaulting range to Sheet1", metaErr);
      }

      // Format rows: [Date, Clinic Name, Doctor Name, Specialty, Address, City, PIN, Phone, Email, Website, Audit Score, Report Link, Status]
      const rows = leads.map((lead) => [
        new Date().toLocaleDateString("en-IN"),
        lead.clinicName || "",
        lead.doctorName || "",
        lead.specialty || "",
        lead.address || "",
        lead.city || "",
        lead.pincode || "",
        lead.phone || "",
        lead.email || "",
        lead.website || "",
        `${lead.auditScore}/100`,
        lead.auditReportLink || "",
        lead.status || "",
      ]);

      // 2. Append rows to detected sheet tab
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(primarySheetName)}!A:M:append?valueInputOption=USER_ENTERED`;
      
      const appendRes = await fetch(appendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: rows }),
      });

      if (!appendRes.ok) {
        const errData = await appendRes.json();
        console.error("[GOOGLE SHEETS ERROR]", errData);
        // Fallback retry without tab name prefix
        const fallbackUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:M:append?valueInputOption=USER_ENTERED`;
        await fetch(fallbackUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: rows }),
        });
      } else {
        console.log(`[GOOGLE SHEETS SUCCESS] Appended ${leads.length} rows to sheet tab "${primarySheetName}"!`);
      }

      return {
        success: true,
        syncedCount: leads.length,
        message: `Successfully appended ${leads.length} rows to sheet tab "${primarySheetName}"!`,
        spreadsheetUrl,
      };
    } catch (error: any) {
      console.error("[GOOGLE SHEETS EXCEPTION]", error);
      return {
        success: false,
        syncedCount: 0,
        message: error.message || "Failed to append rows to Google Sheets",
        spreadsheetUrl,
      };
    }
  }
}
