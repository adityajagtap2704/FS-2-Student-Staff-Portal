import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session || user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const feeId = Number(body?.feeId);
    if (!feeId || Number.isNaN(feeId)) {
      return NextResponse.json({ error: "Missing feeId" }, { status: 400 });
    }

    const studentId = Number(user.id);
    const fee = await db.fee.findFirst({
      where: { id: feeId, studentId },
    });
    if (!fee) return NextResponse.json({ error: "Fee not found" }, { status: 404 });

    const remaining = Number(fee.amount) - Number(fee.paidAmount);
    if (remaining <= 0) {
      return NextResponse.json({ error: "Fee already paid" }, { status: 409 });
    }

    const amountPaise = Math.round(remaining * 100);
    const receipt = `fee_${feeId}_${Date.now()}`;

    const razorpay = getRazorpay();
    const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    if (!razorpay || !publicKey) {
      return NextResponse.json(
        { error: "Payment gateway is not configured (missing Razorpay env vars)" },
        { status: 503 }
      );
    }

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: {
        feeId: String(feeId),
        studentId: String(studentId),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: publicKey,
      name: "KALNET",
      description: `Fee payment - ${fee.term}`,
      prefill: {
        name: user.name ?? "",
        email: user.email ?? "",
      },
      notes: {
        feeId,
      },
    });
  } catch (error) {
    console.error("Payments Order Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

