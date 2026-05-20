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

    const paymentAmount = Number((order as any)?.amount ?? Math.round(Number(fee.amount) * 100)) / 100;
    const notesType = String((notes as any)?.type ?? "");
    const isOutstandingSummary = notesType === "OutstandingSummary";

    let feeToRecordId = fee.id;
    let updatedFee: any = fee;

    if (isOutstandingSummary) {
      const studentIdValue = Number(user.id);
      const allFees = await db.fee.findMany({ where: { studentId: studentIdValue } });
      const unpaidFees = allFees
        .filter((item) => Number(item.paidAmount) < Number(item.amount))
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      if (unpaidFees.length === 0) {
        return NextResponse.json({ error: "No outstanding fees found" }, { status: 400 });
      }

      let remainingPayment = paymentAmount;
      const updatedFees = [];

      for (const unpaidFee of unpaidFees) {
        if (remainingPayment <= 0) break;

        const feeRemaining = Number(unpaidFee.amount) - Number(unpaidFee.paidAmount);
        if (feeRemaining <= 0) continue;

        const appliedAmount = Math.min(feeRemaining, remainingPayment);
        const newPaidAmount = Number(unpaidFee.paidAmount) + appliedAmount;
        const fullPaid = newPaidAmount >= Number(unpaidFee.amount);
        const dueDate = new Date(unpaidFee.dueDate);
        const newStatus = fullPaid
          ? "PAID"
          : dueDate.getTime() < Date.now()
          ? "OVERDUE"
          : "PENDING";

        const updateData: any = {
          paidAmount: newPaidAmount,
          status: newStatus,
          paymentMethod: "ONLINE",
        };

        if (fullPaid) {
          updateData.paidAt = new Date();
        }

        const updated = await db.fee.update({
          where: { id: unpaidFee.id },
          data: updateData,
        });
        updatedFees.push(updated);

        remainingPayment -= appliedAmount;
      }

      if (remainingPayment > 0.001) {
        return NextResponse.json({ error: "Unable to allocate full payment to outstanding fees" }, { status: 500 });
      }

      feeToRecordId = unpaidFees[0].id;
      updatedFee = await db.fee.findUnique({ where: { id: feeToRecordId } });
    } else {
      const newPaidAmount = Number(fee.paidAmount) + paymentAmount;
      const isFull = newPaidAmount >= Number(fee.amount);

      const updateData: any = {
        paidAmount: newPaidAmount,
        status: isFull ? "PAID" : "PENDING",
        paymentMethod: "ONLINE",
      };

      if (isFull) {
        updateData.paidAt = new Date();
      }

      updatedFee = await db.fee.update({
        where: { id: fee.id },
        data: updateData,
      });
    }

    // Record the payment
    await recordSuccessfulPayment({
      feeId: feeToRecordId,
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
    const verifiedFee = await db.fee.findUnique({ where: { id: feeToRecordId } });
    if (!verifiedFee) {
      console.error("Payment recorded but fee not found after update", { feeId: feeToRecordId });
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

