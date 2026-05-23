import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const feeId = parseInt((await params).id);
    const body = await req.json();
    const {
      amount,
      paymentMethod,
      transactionId,
      razorpayOrderId,
      razorpayPaymentId,
      notes,
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method is required" },
        { status: 400 }
      );
    }

    // Get the fee
    const fee = await db.fee.findUnique({
      where: { id: feeId },
    });

    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    // Students can only pay their own fees
    if (user.role === "STUDENT" && parseInt(user.id) !== fee.studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if payment exceeds remaining amount
    const remaining = Number(fee.amount) - Number(fee.paidAmount);
    if (amount > remaining) {
      return NextResponse.json(
        {
          error: `Payment amount exceeds remaining balance. Remaining: ₹${remaining}`,
        },
        { status: 400 }
      );
    }

    // Record payment transaction
    const transaction = await db.feePaymentTransaction.create({
      data: {
        feeId,
        studentId: fee.studentId,
        amount: new Decimal(amount),
        paymentMethod,
        transactionId,
        razorpayOrderId,
        razorpayPaymentId,
        status: "SUCCESS",
        notes,
      },
    });

    // Update fee with payment
    const newPaidAmount = Number(fee.paidAmount) + amount;
    const newStatus =
      newPaidAmount >= Number(fee.amount) ? "PAID" : "PENDING";

    const updatedFee = await db.fee.update({
      where: { id: feeId },
      data: {
        paidAmount: new Decimal(newPaidAmount),
        paidAt: newPaidAmount > 0 ? new Date() : null,
        paymentMethod,
        status: newStatus,
      },
    });

    return NextResponse.json({
      transaction,
      fee: updatedFee,
    });
  } catch (error) {
    console.error("Fee Payment Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
