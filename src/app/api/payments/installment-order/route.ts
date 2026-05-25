import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { getRazorpay } from "@/lib/razorpay";

/**
 * POST /api/payments/installment-order
 * Creates a Razorpay order for a specific installment payment.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session || user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const installmentId = Number(body?.installmentId);
    if (!installmentId || Number.isNaN(installmentId)) {
      return NextResponse.json({ error: "Missing installmentId" }, { status: 400 });
    }

    const studentId = Number(user.id);

    // Fetch the installment and verify it belongs to this student
    const installment = await db.installment.findFirst({
      where: { id: installmentId, studentId },
      include: { fee: true },
    });

    if (!installment) {
      return NextResponse.json({ error: "Installment not found" }, { status: 404 });
    }

    if (installment.status === "PAID") {
      return NextResponse.json({ error: "Installment already paid" }, { status: 409 });
    }

    const remaining = Number(installment.amount) - Number(installment.paidAmount);
    if (remaining <= 0) {
      return NextResponse.json({ error: "Installment already paid" }, { status: 409 });
    }

    // Enforce sequential payment — installment 2 cannot be paid before installment 1
    if (installment.installmentNumber > 1) {
      const prevInstallment = await db.installment.findFirst({
        where: {
          feeId: installment.feeId,
          installmentNumber: installment.installmentNumber - 1,
        },
      });
      if (prevInstallment && prevInstallment.status !== "PAID") {
        return NextResponse.json(
          { error: `Please pay Installment ${installment.installmentNumber - 1} first` },
          { status: 422 }
        );
      }
    }

    const amountPaise = Math.round(remaining * 100);
    const receipt = `inst_${installmentId}_${Date.now()}`;

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
        installmentId: String(installmentId),
        feeId: String(installment.feeId),
        studentId: String(studentId),
        type: "Installment",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: publicKey,
      name: "KALNET",
      description: `Installment ${installment.installmentNumber} — ${installment.fee.term}`,
      prefill: {
        name: user.name ?? "",
        email: user.email ?? "",
      },
      notes: {
        installmentId,
        feeId: installment.feeId,
      },
    });
  } catch (error) {
    console.error("Installment Order Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
