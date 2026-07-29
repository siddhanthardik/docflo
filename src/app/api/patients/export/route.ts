import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session || !session.doctorId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.accountType !== "DOCTOR") {
      return new NextResponse("Forbidden: Only clinic owners can export patients", { status: 403 });
    }

    const patients = await prisma.patient.findMany({
      where: {
        doctorId: session.doctorId,
      },
      include: {
        tags: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate CSV
    const headers = [
      "Patient ID",
      "Name",
      "Phone",
      "Gender",
      "Age",
      "Last Visit",
      "Created At",
      "Tags",
    ];

    const rows = patients.map(p => {
      return [
        p.id,
        p.name,
        p.phone || "",
        p.gender || "",
        p.age || "",
        p.lastVisit ? p.lastVisit.toISOString() : "",
        p.createdAt.toISOString(),
        p.tags.map(t => t.name).join(", "),
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="patients_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export Patients Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
