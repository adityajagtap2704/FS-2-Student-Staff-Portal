import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { getRazorpay } from "@/lib/razorpay";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * POST /api/payments/outstanding
 * Creates a payment order for outstanding/miscellaneous fees
 * This endpoint handles payments that are not tied to a specific term fee
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const amount = Number(body?.amount);
    const reason = String(body?.reason || "Outstanding Payment");
    const requestedStudentId = body?.studentId ? Number(body.studentId) : undefined;
    const currentStudentId = Number(user.id);

    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const razorpay = getRazorpay();
    const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;

    // HOD / admin route: create a miscellaneous outstanding fee for a student
    if (requestedStudentId !== undefined) {
      if (user.role !== "HOD" && !(user.role === "STUDENT" && requestedStudentId === currentStudentId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const outstandingFee = await db.fee.create({
        data: {
          studentId: requestedStudentId,
          term: reason || `Outstanding - ${new Date().toLocaleDateString()}`,
          dueDate: new Date(),
          amount: new Decimal(amount),
          paidAmount: new Decimal(0),
          type: "Outstanding",
          status: "PENDING",
        },
      });

      return NextResponse.json({
        success: true,
        fee: outstandingFee,
      });
    }

    // Student route: pay current outstanding dues without creating a duplicate fee record
    if (user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const fees = await db.fee.findMany({ where: { studentId: currentStudentId } });
    const unpaidFees = fees.filter((fee) => Number(fee.paidAmount) < Number(fee.amount));
    const outstandingBalance = unpaidFees.reduce(
      (sum, fee) => sum + (Number(fee.amount) - Number(fee.paidAmount)),
      0
    );

    if (outstandingBalance <= 0) {
      return NextResponse.json({ error: "No outstanding balance to pay" }, { status: 400 });
    }

    if (amount > outstandingBalance) {
      return NextResponse.json({ error: "Payment amount exceeds outstanding balance" }, { status: 400 });
    }

    if (!razorpay || !publicKey) {
      return NextResponse.json(
        { error: "Payment gateway is not configured" },
        { status: 503 }
      );
    }

    const sortedFees = unpaidFees.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    const firstFeeId = sortedFees[0]?.id;
    if (!firstFeeId) {
      return NextResponse.json({ error: "Unable to determine outstanding fees" }, { status: 500 });
    }

    const amountPaise = Math.round(amount * 100);
    const receipt = `outstanding_balance_${currentStudentId}_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: {
        studentId: String(currentStudentId),
        feeId: String(firstFeeId),
        type: "OutstandingSummary",
        reason,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: publicKey,
      name: "KALNET",
      description: `Outstanding Payment - ${reason}`,
      prefill: {
        name: user.name ?? "",
        email: user.email ?? "",
      },
      notes: {
        feeId: firstFeeId,
      },
    });
  } catch (error) {
    console.error("Outstanding Payment Order Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
