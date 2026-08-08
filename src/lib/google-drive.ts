/**
 * Google Drive API Service Module for Gyrex Database Backups
 */

interface GoogleDriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink?: string;
  webContentLink?: string;
  sizeBytes?: number;
}

export class GoogleDriveService {
  private static async getAccessToken(): Promise<string | null> {
    const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
      console.log("[GOOGLE DRIVE] No service account credentials found in .env (GOOGLE_DRIVE_CLIENT_EMAIL / GOOGLE_DRIVE_PRIVATE_KEY)");
      return null;
    }

    try {
      // Create JWT token for Google OAuth2
      const header = { alg: "RS256", typ: "JWT" };
      const now = Math.floor(Date.now() / 1000);
      const claimSet = {
        iss: clientEmail,
        scope: "https://www.googleapis.com/auth/drive.file",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      };

      const crypto = await import("crypto");
      
      const base64UrlEncode = (str: string) => {
        return Buffer.from(str)
          .toString("base64")
          .replace(/=/g, "")
          .replace(/\+/g, "-")
          .replace(/\//g, "_");
      };

      const encodedHeader = base64UrlEncode(JSON.stringify(header));
      const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
      const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

      const signer = crypto.createSign("RSA-SHA256");
      signer.update(signatureInput);
      const signature = signer.sign(privateKey, "base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      const jwt = `${signatureInput}.${signature}`;

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
        console.error("[GOOGLE DRIVE] Token Exchange Error:", tokenData);
        return null;
      }

      return tokenData.access_token;
    } catch (error) {
      console.error("[GOOGLE DRIVE] Auth Error:", error);
      return null;
    }
  }

  /**
   * Uploads a database backup file to Google Drive folder
   */
  static async uploadBackup(
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string = "application/json"
  ): Promise<GoogleDriveUploadResult | null> {
    const accessToken = await this.getAccessToken();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!accessToken) {
      console.log("[GOOGLE DRIVE] Simulated Backup Upload (No credentials set)");
      return {
        fileId: `simulated_${Date.now()}`,
        fileName,
        webViewLink: `https://drive.google.com/drive/folders/${folderId || 'gyrex-backups'}`,
        sizeBytes: fileBuffer.length,
      };
    }

    try {
      const metadata = {
        name: fileName,
        parents: folderId ? [folderId] : undefined,
      };

      const boundary = "-------314159265358979323846";
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const multipartRequestBody =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n` +
        "Content-Transfer-Encoding: base64\r\n\r\n" +
        fileBuffer.toString("base64") +
        close_delim;

      const uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,webContentLink,size",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      const data = await uploadRes.json();
      if (!uploadRes.ok) {
        console.error("[GOOGLE DRIVE] Upload Error:", data);
        return null;
      }

      console.log(`[GOOGLE DRIVE SUCCESS] Uploaded ${fileName} (ID: ${data.id})`);
      return {
        fileId: data.id,
        fileName: data.name,
        webViewLink: data.webViewLink,
        webContentLink: data.webContentLink,
        sizeBytes: Number(data.size || fileBuffer.length),
      };
    } catch (error) {
      console.error("[GOOGLE DRIVE] Upload Exception:", error);
      return null;
    }
  }

  /**
   * Cleans up backup files on Google Drive older than retentionDays (default: 30)
   */
  static async cleanupOldBackups(retentionDays: number = 30): Promise<number> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return 0;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const formattedCutoff = cutoffDate.toISOString();

      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      let query = `createdTime < '${formattedCutoff}' and name contains 'gyrex_backup_'`;
      if (folderId) {
        query += ` and '${folderId}' in parents`;
      }

      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          query
        )}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,createdTime)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const listData = await listRes.json();
      const filesToDelete = listData.files || [];

      let deletedCount = 0;
      for (const file of filesToDelete) {
        const delRes = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?supportsAllDrives=true`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (delRes.ok) deletedCount++;
      }

      console.log(`[GOOGLE DRIVE CLEANUP] Removed ${deletedCount} backup files older than ${retentionDays} days.`);
      return deletedCount;
    } catch (error) {
      console.error("[GOOGLE DRIVE] Cleanup Error:", error);
      return 0;
    }
  }
}
