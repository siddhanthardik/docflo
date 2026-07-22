import { prisma } from "./prisma";

interface AuditLogPayload {
  userId: string;
  userType: "PLATFORM" | "CLINIC" | "STAFF" | "SYSTEM" | "UNKNOWN";
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity(payload: AuditLogPayload) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        userType: payload.userType,
        action: payload.action,
        details: payload.details || {},
        ipAddress: payload.ipAddress || null,
        userAgent: payload.userAgent || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // We don't throw here to avoid breaking the main application flow
    // if the audit log fails to write.
  }
}
