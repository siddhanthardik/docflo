import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";

export const dynamic = "force-dynamic";

export interface DiagnosticPartnerItem {
  id: string;
  name: string;
  phone: string;
  createdAt?: string;
}

export async function GET() {
  try {
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentConfig = await prisma.aIAgentConfig.findUnique({
      where: { doctorId_agentType: { doctorId, agentType: "APPOINTMENT" } },
    });

    const config = (agentConfig?.config as any) || {};
    const partners: DiagnosticPartnerItem[] = Array.isArray(config.diagnosticPartners)
      ? config.diagnosticPartners
      : [];

    return NextResponse.json({ partners });
  } catch (error: any) {
    console.error("[DiagnosticPartners:GET] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load partners" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Partner or Laboratory name is required" }, { status: 400 });
    }

    const cleanPhone = (phone || "").trim().replace(/[^\d+]/g, "");
    const digitsOnly = cleanPhone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit mobile number" }, { status: 400 });
    }

    const agentConfig = await prisma.aIAgentConfig.findUnique({
      where: { doctorId_agentType: { doctorId, agentType: "APPOINTMENT" } },
    });

    const existingConfig: Record<string, any> = (agentConfig?.config as any) || {};
    const existingPartners: DiagnosticPartnerItem[] = Array.isArray(existingConfig.diagnosticPartners)
      ? [...existingConfig.diagnosticPartners]
      : [];

    // Check duplicate phone by last 10 digits
    const last10 = digitsOnly.slice(-10);
    const isDuplicate = existingPartners.some((p) => p.phone.replace(/\D/g, "").slice(-10) === last10);
    if (isDuplicate) {
      return NextResponse.json({ error: "This phone number is already registered in the whitelist" }, { status: 409 });
    }

    const newPartner: DiagnosticPartnerItem = {
      id: `partner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      phone: cleanPhone,
      createdAt: new Date().toISOString(),
    };

    const updatedPartners = [...existingPartners, newPartner];
    const silentPartnerNumbers = updatedPartners.map((p) => p.phone);

    const updatedConfig = {
      ...existingConfig,
      diagnosticPartners: updatedPartners,
      silentPartnerNumbers,
    };

    await prisma.aIAgentConfig.upsert({
      where: { doctorId_agentType: { doctorId, agentType: "APPOINTMENT" } },
      create: {
        doctorId,
        agentType: "APPOINTMENT",
        enabled: true,
        config: updatedConfig as any,
      },
      update: {
        config: updatedConfig as any,
      },
    });

    return NextResponse.json({ success: true, partner: newPartner, partners: updatedPartners });
  } catch (error: any) {
    console.error("[DiagnosticPartners:POST] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to add partner" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });
    }

    const agentConfig = await prisma.aIAgentConfig.findUnique({
      where: { doctorId_agentType: { doctorId, agentType: "APPOINTMENT" } },
    });

    if (!agentConfig) {
      return NextResponse.json({ success: true, partners: [] });
    }

    const existingConfig: Record<string, any> = (agentConfig.config as any) || {};
    const existingPartners: DiagnosticPartnerItem[] = Array.isArray(existingConfig.diagnosticPartners)
      ? existingConfig.diagnosticPartners
      : [];

    const updatedPartners = existingPartners.filter((p) => p.id !== id);
    const silentPartnerNumbers = updatedPartners.map((p) => p.phone);

    const updatedConfig = {
      ...existingConfig,
      diagnosticPartners: updatedPartners,
      silentPartnerNumbers,
    };

    await prisma.aIAgentConfig.update({
      where: { doctorId_agentType: { doctorId, agentType: "APPOINTMENT" } },
      data: { config: updatedConfig as any },
    });

    return NextResponse.json({ success: true, partners: updatedPartners });
  } catch (error: any) {
    console.error("[DiagnosticPartners:DELETE] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to remove partner" }, { status: 500 });
  }
}
