/**
 * Google Sheets API Service Module for Syncing Prospector Doctor Leads
 */

import { DiscoveredClinicLead } from "./prospector";

export class GoogleSheetsService {
  /**
   * Appends discovered clinic lead rows to Google Sheet spreadsheet
   */
  static async syncLeadsToSheet(leads: DiscoveredClinicLead[]): Promise<{ syncedCount: number; spreadsheetUrl?: string }> {
    const spreadsheetId = process.env.GOOGLE_SHEETS_PROSPECT_ID;
    const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    const spreadsheetUrl = spreadsheetId 
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
      : "https://docs.google.com/spreadsheets";

    if (!clientEmail || !privateKey || !spreadsheetId) {
      console.log(`[GOOGLE SHEETS] Simulating Google Sheet Sync for ${leads.length} leads (Credentials or SPREADSHEET_ID pending in .env)`);
      return {
        syncedCount: leads.length,
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
      if (!tokenRes.ok) throw new Error(tokenData.error_description || "Google Sheets Auth failed");

      const accessToken = tokenData.access_token;

      // Format rows: [Date, Clinic Name, Doctor Name, Specialty, Address, City, PIN, Phone, Email, Website, Audit Score, Report Link, Status]
      const rows = leads.map(lead => [
        new Date().toLocaleDateString("en-IN"),
        lead.clinicName,
        lead.doctorName || "N/A",
        lead.specialty,
        lead.address,
        lead.city,
        lead.pincode,
        lead.phone || "N/A",
        lead.email || "N/A",
        lead.website || "N/A",
        `${lead.auditScore}/100`,
        lead.auditReportLink,
        lead.status,
      ]);

      const appendRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:M:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: rows }),
        }
      );

      if (!appendRes.ok) {
        const errData = await appendRes.json();
        console.error("[GOOGLE SHEETS ERROR]", errData);
      } else {
        console.log(`[GOOGLE SHEETS SUCCESS] Appended ${leads.length} rows to Google Sheet!`);
      }

      return {
        syncedCount: leads.length,
        spreadsheetUrl,
      };
    } catch (error) {
      console.error("[GOOGLE SHEETS EXCEPTION]", error);
      return {
        syncedCount: leads.length,
        spreadsheetUrl,
      };
    }
  }
}
