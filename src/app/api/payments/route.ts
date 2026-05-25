import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listPaymentsForRole } from "@/lib/paymentDb";
import db from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session || !user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url   = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "50");

    if (user.role === "STUDENT") {
      const studentId = Number(user.id);

      // 1. Razorpay / full-fee payments (existing)
      const razorpayPayments = await listPaymentsForRole({
        role: "STUDENT",
        studentId,
        limit,
      });

      // 2. Installment payments — fetch paid installments for this student
      const paidInstallments = await db.installment.findMany({
        where: {
          studentId,
          status: "PAID",
        },
        include: {
          fee: {
            select: { id: true, term: true, type: true },
          },
        },
        orderBy: { paidAt: "desc" },
        take: limit,
      });

      // Shape installment rows to match the Payment interface
      const installmentPayments = paidInstallments.map((inst) => ({
        feeId:             inst.feeId,
        installmentId:     inst.id,
        installmentNumber: inst.installmentNumber,
        studentId,
        studentName:       "",          // filled client-side from session
        classEnrolled:     "",
        term:              inst.fee?.term ?? "—",
        feeType:           inst.fee?.type ?? "Tuition",
        amountPaise:       Math.round(Number(Number(inst.paidAmount ?? 0) > 0 ? inst.paidAmount : inst.amount) * 100),
        currency:          "INR",
        status:            "PAID",
        razorpayOrderId:   null,
        razorpayPaymentId: null,
        receiptNumber:     null,
        updatedAt:         inst.paidAt?.toISOString() ?? new Date().toISOString(),
        paymentType:       "INSTALLMENT" as const,
      }));

      // Shape Razorpay rows
      const fullPayments = razorpayPayments.map((p: any) => ({
        ...p,
        installmentId:     null,
        installmentNumber: null,
        feeType:           "Tuition",
        paymentType:       "FULL" as const,
      }));

      // Merge and sort newest first
      const all = [...fullPayments, ...installmentPayments].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return NextResponse.json({ payments: all });
    }

    if (user.role === "CLASS_TEACHER") {
      const payments = await listPaymentsForRole({
        role: "CLASS_TEACHER",
        assignedClass: user.assignedClass,
        limit,
      });
      return NextResponse.json({ payments });
    }

    if (user.role === "HOD") {
      const payments = await listPaymentsForRole({ role: "HOD", limit });
      return NextResponse.json({ payments });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("Payments List Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
