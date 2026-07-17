import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { entryId } = await req.json()
  await prisma.waitlistEntry.update({
    where: { id: entryId },
    data: { status: "NOTIFIED", notifiedAt: new Date() },
  })

  // In real implementation, send WhatsApp message via ReminderService
  return NextResponse.json({ success: true })
}