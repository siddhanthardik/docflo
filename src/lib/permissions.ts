import { PlatformRole, ClinicRole } from "@prisma/client";

// Action definitions
export type PermissionAction =
  // Platform Actions
  | "MANAGE_BILLING"
  | "VIEW_LEADS"
  | "MANAGE_USERS"
  | "VIEW_REPORTS"
  | "MANAGE_PACKAGES"
  | "MANAGE_PROMOTIONS"
  | "VIEW_AUDIT_LOGS"
  | "IMPERSONATE_USER"
  // Clinic Actions
  | "MANAGE_APPOINTMENTS"
  | "MANAGE_PATIENTS"
  | "MANAGE_STAFF"
  | "MANAGE_GBP"
  | "REPLY_REVIEWS"
  | "SEND_CAMPAIGNS";

// Platform Role Matrix
const platformPermissions: Record<PlatformRole, PermissionAction[]> = {
  SUPERADMIN: [
    "MANAGE_BILLING", "VIEW_LEADS", "MANAGE_USERS", "VIEW_REPORTS",
    "MANAGE_PACKAGES", "MANAGE_PROMOTIONS", "VIEW_AUDIT_LOGS", "IMPERSONATE_USER",
    "MANAGE_GBP", "REPLY_REVIEWS" // Admins can do clinic stuff if impersonating
  ],
  SUPERVISOR: [
    "VIEW_LEADS", "MANAGE_USERS", "VIEW_REPORTS", "VIEW_AUDIT_LOGS"
  ],
  SUPPORT: [
    "VIEW_REPORTS", "MANAGE_USERS"
  ],
  SALES: [
    "VIEW_LEADS", "VIEW_REPORTS", "MANAGE_USERS"
  ],
  MARKETING: [
    "VIEW_REPORTS", "MANAGE_PROMOTIONS"
  ],
  ACCOUNTS: [
    "MANAGE_BILLING", "VIEW_REPORTS", "MANAGE_PACKAGES"
  ],
};

// Clinic Role Matrix
const clinicPermissions: Record<string, PermissionAction[]> = {
  DOCTOR: [
    "MANAGE_APPOINTMENTS", "MANAGE_PATIENTS", "MANAGE_STAFF",
    "MANAGE_GBP", "REPLY_REVIEWS", "SEND_CAMPAIGNS", "MANAGE_BILLING"
  ],
  ADMIN: [
    "MANAGE_APPOINTMENTS", "MANAGE_PATIENTS", "MANAGE_STAFF",
    "MANAGE_GBP", "REPLY_REVIEWS", "SEND_CAMPAIGNS"
  ],
  MANAGER: [
    "MANAGE_APPOINTMENTS", "MANAGE_PATIENTS", "MANAGE_STAFF",
    "REPLY_REVIEWS", "SEND_CAMPAIGNS"
  ],
  STAFF: [
    "MANAGE_APPOINTMENTS", "MANAGE_PATIENTS"
  ],
  RECEPTIONIST: [
    "MANAGE_APPOINTMENTS", "MANAGE_PATIENTS"
  ],
  NURSE: [
    "MANAGE_APPOINTMENTS", "MANAGE_PATIENTS"
  ]
};

export function hasPermission(role: string, action: PermissionAction): boolean {
  // Check Platform Roles
  if (role in platformPermissions) {
    return platformPermissions[role as PlatformRole].includes(action);
  }
  
  // Check Clinic Roles
  if (role in clinicPermissions) {
    return clinicPermissions[role].includes(action);
  }

  return false;
}

export function isPlatformRole(role: string): boolean {
  return role in platformPermissions;
}

export function isClinicRole(role: string): boolean {
  return role in clinicPermissions;
}
