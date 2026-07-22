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
    // If table is missing optional columns during migration, try fallback without optional columns
    try {
      await prisma.auditLog.create({
        data: {
          userId: payload.userId,
          userType: payload.userType,
          action: payload.action,
          details: payload.details || {},
        },
      });
    } catch (fallbackError) {
      console.error("Failed to write audit log:", fallbackError);
    }
  }
}
