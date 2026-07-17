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

  // If the logged‑in user is a staff member, use the linked doctorId
  if (role === "RECEPTIONIST" || role === "STAFF") {
    const staffDoctorId = user.doctorId
    if (!staffDoctorId) {
      throw new Error("Staff account not linked to a clinic")
    }
    doctorId = staffDoctorId
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

  return { userId: user.id, doctorId, role, locationId };
}

export function isDoctor(role: string) {
  return role === "DOCTOR" || role === "ADMIN"
}