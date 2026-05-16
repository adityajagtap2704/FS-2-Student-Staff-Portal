import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user    = session?.user as any;
    if (!session || user?.role !== "HOD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const classFilter = (url.searchParams.get("class") || "").trim();

    const fees = await db.fee.findMany({
      where: classFilter ? { student: { classEnrolled: classFilter } } : undefined,
      include: { student: { select: { id: true, name: true, classEnrolled: true, rollNumber: true } } },
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
    });

    // Group fees by student and aggregate their status
    const studentFeesMap = new Map<number, any>();
    
    for (const fee of fees) {
      if (!studentFeesMap.has(fee.studentId)) {
        studentFeesMap.set(fee.studentId, {
          id: fee.id,
          studentId: fee.studentId,
          student: fee.student,
          term: fee.term,
          dueDate: fee.dueDate,
          amount: Number(fee.amount),
          paidAmount: Number(fee.paidAmount),
          status: fee.status,
          allTerms: [],
          totalAmount: 0,
          totalPaidAmount: 0,
          totalDueAmount: 0,
          hasOverdue: false,
          hasPending: false,
          allPaid: true,
        });
      }
      
      const studentData = studentFeesMap.get(fee.studentId)!;
      studentData.allTerms.push({
        term: fee.term,
        amount: Number(fee.amount),
        paidAmount: Number(fee.paidAmount),
        status: fee.status,
      });
      
      studentData.totalAmount += Number(fee.amount);
      studentData.totalPaidAmount += Number(fee.paidAmount);
      studentData.totalDueAmount += Number(fee.amount) - Number(fee.paidAmount);
      
      if (fee.status === "OVERDUE") studentData.hasOverdue = true;
      if (fee.status === "PENDING") studentData.hasPending = true;
      if (fee.status !== "PAID") studentData.allPaid = false;
    }

    // Determine aggregated status for each student
    const deduplicatedFees = Array.from(studentFeesMap.values()).map(student => {
      let aggregatedStatus = "PAID";
      if (student.hasOverdue) {
        aggregatedStatus = "OVERDUE";
      } else if (student.hasPending) {
        aggregatedStatus = "PENDING";
      }
      
      return {
        ...student,
        status: aggregatedStatus,
        amount: student.totalAmount,
        paidAmount: student.totalPaidAmount,
      };
    });

    const summary = {
      PAID:    { count: 0, total: 0 },
      PENDING: { count: 0, total: 0 },
      OVERDUE: { count: 0, total: 0 },
    } as Record<string, { count: number; total: number }>;

    for (const fee of fees) {
      summary[fee.status].count++;
      summary[fee.status].total += Number(fee.amount);
    }

    const classes = await db.student.findMany({
      select: { classEnrolled: true },
      distinct: ["classEnrolled"],
      where: { classEnrolled: { not: null } },
    });

    return NextResponse.json({
      fees: deduplicatedFees,
      allFees: fees,
      summary,
      classes: classes.map(c => c.classEnrolled).filter(Boolean).sort(),
      activeClass: classFilter || "ALL",
    });
  } catch (error) {
    console.error("HOD Fees Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Phase 2: Add PATCH endpoint for fee payment with validation
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user    = session?.user as any;
    if (!session || user?.role !== "HOD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { feeId, paidAmount } = body;

    if (!feeId || paidAmount === undefined) {
      return NextResponse.json({ error: "Missing feeId or paidAmount" }, { status: 400 });
    }

    const fee = await db.fee.findUnique({ where: { id: feeId } });
    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    // Phase 2: Fee amount validation - paidAmount cannot exceed total amount
    const newPaidAmount = Number(fee.paidAmount) + Number(paidAmount);
    if (newPaidAmount > Number(fee.amount)) {
      return NextResponse.json({
        error: `Payment amount exceeds fee amount. Fee: ${fee.amount}, Already paid: ${fee.paidAmount}, Attempting to pay: ${paidAmount}`,
        code: "PAYMENT_EXCEEDS_AMOUNT"
      }, { status: 422 });
    }

    // Determine new status
    let newStatus = fee.status;
    if (newPaidAmount >= Number(fee.amount)) {
      newStatus = "PAID";
    } else if (newPaidAmount > 0) {
      newStatus = "PENDING";
    }

    const updated = await db.fee.update({
      where: { id: feeId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
      include: { student: { select: { name: true, classEnrolled: true, rollNumber: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("HOD Fees PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
