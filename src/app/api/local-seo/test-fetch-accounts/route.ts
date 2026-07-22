import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const accounts = await prisma.gbpAccount.findMany();
    return NextResponse.json({ accounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch accounts" }, { status: 500 });
  }
}
