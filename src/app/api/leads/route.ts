import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Basic in-memory rate limiter for the leads endpoint
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

export async function POST(req: Request) {
  try {
    // 1. Basic Rate Limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
    if (ip !== "unknown") {
      const now = Date.now();
      const userRate = rateLimitMap.get(ip) || { count: 0, lastReset: now };
      
      if (now - userRate.lastReset > RATE_LIMIT_WINDOW_MS) {
        userRate.count = 1;
        userRate.lastReset = now;
      } else {
        userRate.count++;
      }
      
      rateLimitMap.set(ip, userRate);
      
      if (userRate.count > MAX_REQUESTS_PER_WINDOW) {
        return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
      }
    }

    const body = await req.json();
    const { name, email, phone, clinicName, source } = body;

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400 }
      );
    }

    const lead = await prisma.platformLead.create({
      data: {
        name,
        email,
        phone,
        clinicName,
        source: source || "UNKNOWN",
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
