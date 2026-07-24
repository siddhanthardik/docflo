import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, receipt } = body;

    if (!amount || amount < 100) {
      return NextResponse.json({ error: "Amount must be at least 100 paise" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: amount,
      currency: currency || "INR",
      receipt: receipt || `receipt_${Date.now()}`
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error: any) {
    console.error("Create Order Error:", error);
    
    // Handle specific Razorpay API auth errors
    if (error.statusCode === 401) {
       return NextResponse.json({ error: "Razorpay Auth Failed" }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
