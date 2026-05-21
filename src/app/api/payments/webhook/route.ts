import { NextResponse } from "next/server";
import crypto from "crypto";
import db from "@/lib/db";
import { recordSuccessfulPayment } from "@/lib/paymentDb";

function verifyWebhookSignature(payload: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing env var: RAZORPAY_WEBHOOK_SECRET");
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-razorpay-signature") || "";
    const payload = await req.text();
    if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(payload);
    const eventName = String(event?.event || "");

    // We primarily care about successful captured payments.
    if (eventName !== "payment.captured" && eventName !== "order.paid") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const paymentEntity = event?.payload?.payment?.entity;
    const orderEntity = event?.payload?.order?.entity;

    const razorpayOrderId = String(paymentEntity?.order_id || orderEntity?.id || "");
    const razorpayPaymentId = String(paymentEntity?.id || "");
    const notes = (orderEntity?.notes || paymentEntity?.notes || {}) as Record<string, any>;
    const feeId = Number(notes.feeId);
    const studentId = Number(notes.studentId);

    if (!razorpayOrderId) return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    if (!feeId || Number.isNaN(feeId) || !studentId || Number.isNaN(studentId)) {
      return NextResponse.json({ ok: true, missingMapping: true });
    }

    const fee = await db.fee.findUnique({ where: { id: Number(feeId) } });
    if (fee && fee.status !== "PAID") {
      await db.fee.update({
        where: { id: fee.id },
        data: { paidAmount: fee.amount, status: "PAID" },
      });
    }

    // We don't get the checkout signature here; store event as raw response.
    await recordSuccessfulPayment({
      feeId,
      studentId,
      amountPaise: Number(paymentEntity?.amount ?? orderEntity?.amount ?? 0),
      currency: String(paymentEntity?.currency ?? orderEntity?.currency ?? "INR"),
      razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId || `webhook_${Date.now()}`,
      razorpaySignature: signature,
      receipt: String(orderEntity?.receipt ?? null),
      rawResponse: event,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Payments Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

