import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import crypto from "crypto";
import { getRazorpay } from "@/lib/razorpay";
import { recordSuccessfulPayment } from "@/lib/paymentDb";

function verifySignature(params: { orderId: string; paymentId: string; signature: string }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("Missing env var: RAZORPAY_KEY_SECRET");

  const body = `${params.orderId}|${params.paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(params.signature));
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session || user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const orderId = String(body?.razorpay_order_id || "");
    const paymentId = String(body?.razorpay_payment_id || "");
    const signature = String(body?.razorpay_signature || "");

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing Razorpay fields" }, { status: 400 });
    }

    const ok = verifySignature({ orderId, paymentId, signature });
    if (!ok) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      return NextResponse.json({ error: "Payment gateway is not configured" }, { status: 503 });
    }

    // Fetch order details from Razorpay so we can persist ONLY after success
    const order = await razorpay.orders.fetch(orderId);
    const notes = (order as any)?.notes ?? {};
    const feeId = Number(notes.feeId);
    const studentIdFromOrder = Number(notes.studentId);
    if (!feeId || Number.isNaN(feeId)) {
      return NextResponse.json({ error: "Order is missing fee mapping" }, { status: 422 });
    }
    if (studentIdFromOrder && studentIdFromOrder !== Number(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const fee = await db.fee.findUnique({ where: { id: feeId } });
    if (!fee) {
      return NextResponse.json({ error: "Fee record not found" }, { status: 404 });
    }

    // Update fee with payment details
    const paymentAmount = Number((order as any)?.amount ?? Math.round(Number(fee.amount) * 100)) / 100;
    const newPaidAmount = Number(fee.paidAmount) + paymentAmount;
    const isFull = newPaidAmount >= Number(fee.amount);
    
    // Only update paidAt if this is a full payment
    // For partial payments, keep the original paidAt (if any) or set it only on full payment
    const updateData: any = {
      paidAmount: newPaidAmount,
      status: isFull ? "PAID" : "PENDING",
      paymentMethod: "ONLINE",
    };

    // Only set paidAt when payment is fully completed
    if (isFull) {
      updateData.paidAt = new Date();
    }

    const updatedFee = await db.fee.update({
      where: { id: fee.id },
      data: updateData,
    });

    // Record the payment
    await recordSuccessfulPayment({
      feeId: fee.id,
      studentId: fee.studentId,
      amountPaise: Number((order as any)?.amount ?? Math.round(Number(paymentAmount) * 100)),
      currency: String((order as any)?.currency ?? "INR"),
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      receipt: String((order as any)?.receipt ?? null),
      rawResponse: body ?? null,
    });

    // Verify the update was successful
    const verifiedFee = await db.fee.findUnique({ where: { id: feeId } });
    if (!verifiedFee) {
      console.error("Payment recorded but fee not found after update", { feeId });
      return NextResponse.json({ 
        error: "Payment recorded but fee verification failed",
        warning: "Please refresh the page to see updated status"
      }, { status: 500 });
    }

    console.log("[PAYMENT] Payment verified and fee updated:", { feeId, status: verifiedFee.status, paidAmount: verifiedFee.paidAmount });

    return NextResponse.json({ ok: true, fee: verifiedFee });
  } catch (error) {
    console.error("Payments Verify Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

