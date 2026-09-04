import { auth } from "@/lib/auth"

export async function getSessionData() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  // Cast to any to avoid TypeScript errors with custom properties
  const user = session.user as any

  let doctorId = user.id
  const role = user.role || "DOCTOR"
  const isSuperAdmin = user.originalRole === "SUPERADMIN" || user.role === "SUPERADMIN"
  const isImpersonating = !!user.originalAdminId || !!user.impersonate

  // If the logged-in user is a staff member or has a linked clinic, use the linked doctorId
  if (user.doctorId) {
    doctorId = user.doctorId
  } else if (["RECEPTIONIST", "STAFF", "NURSE", "MANAGER", "ADMIN"].includes(role)) {
    const staffDoctorId = user.doctorId
    if (staffDoctorId) {
      doctorId = staffDoctorId
    }
  }

  // Read the active location ID from cookies if available
  let locationId = null;
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    locationId = cookieStore.get("activeLocationId")?.value || null;
  } catch (e) {
    // Ignore error if cookies cannot be read (e.g. outside request context)
  }

  return { userId: user.id, doctorId, role, isSuperAdmin, isImpersonating, locationId };
}

/**
 * Returns the canonical clinic doctor ID for any session (doctor or staff member).
 */
export function getEffectiveDoctorId(session: any): string {
  return session?.user?.doctorId || session?.user?.id || "";
}

export function isDoctor(role: string) {
  return role === "DOCTOR" || role === "ADMIN"
}