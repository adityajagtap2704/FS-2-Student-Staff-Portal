import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import crypto from "crypto";
import { getRazorpay } from "@/lib/razorpay";

function verifySignature(params: { orderId: string; paymentId: string; signature: string }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("Missing env var: RAZORPAY_KEY_SECRET");
  const body = `${params.orderId}|${params.paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(params.signature));
}

/**
 * POST /api/payments/installment-verify
 * Verifies Razorpay payment for an installment and marks it as PAID.
 * Also updates the parent Fee's paidAmount.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session || user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const orderId   = String(body?.razorpay_order_id   || "");
    const paymentId = String(body?.razorpay_payment_id || "");
    const signature = String(body?.razorpay_signature  || "");

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

    // Fetch order from Razorpay to get installmentId
    const order = await razorpay.orders.fetch(orderId);
    const notes = (order as any)?.notes ?? {};
    const installmentId = Number(notes.installmentId);
    const studentIdFromOrder = Number(notes.studentId);

    if (!installmentId || Number.isNaN(installmentId)) {
      return NextResponse.json({ error: "Order is missing installment mapping" }, { status: 422 });
    }
    if (studentIdFromOrder && studentIdFromOrder !== Number(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const installment = await db.installment.findUnique({
      where: { id: installmentId },
      include: { fee: true },
    });

    if (!installment) {
      return NextResponse.json({ error: "Installment not found" }, { status: 404 });
    }

    const paymentAmount = Number((order as any)?.amount ?? 0) / 100;

    // Mark installment as PAID
    const updatedInstallment = await db.installment.update({
      where: { id: installmentId },
      data: {
        status: "PAID",
        paidAmount: Number(installment.amount),
        paidAt: new Date(),
        paymentMethod: "ONLINE",
      },
    });

    // Update the parent fee's paidAmount
    const newFeePaid = Number(installment.fee.paidAmount) + paymentAmount;
    const feeFullyPaid = newFeePaid >= Number(installment.fee.amount);
    await db.fee.update({
      where: { id: installment.feeId },
      data: {
        paidAmount: newFeePaid,
        status: feeFullyPaid ? "PAID" : "PENDING",
        ...(feeFullyPaid ? { paidAt: new Date(), paymentMethod: "ONLINE" } : {}),
      },
    });

    // Record the transaction
    await db.feePaymentTransaction.create({
      data: {
        feeId: installment.feeId,
        studentId: installment.studentId,
        amount: paymentAmount,
        paymentMethod: "ONLINE",
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        status: "SUCCESS",
        notes: `Installment ${installment.installmentNumber} payment`,
      },
    });

    return NextResponse.json({
      ok: true,
      installment: updatedInstallment,
      message: `Installment ${installment.installmentNumber} paid successfully`,
    });
  } catch (error) {
    console.error("Installment Verify Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
