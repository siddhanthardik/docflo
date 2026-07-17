import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { StaffManagement } from "@/components/staff/staff-management"
import { redirect } from "next/navigation"
import { Users } from "lucide-react"

export default async function StaffPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")   // guards against undefined user

  const staff = await prisma.staffMember.findMany({
    where: { doctorId: session.user.id },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage your clinic team — add, edit, or remove staff members.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Users className="h-3 w-3" />
            {staff.length} {staff.length === 1 ? "member" : "members"}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <StaffManagement initialStaff={staff} />
      </div>
    </div>
  )
}