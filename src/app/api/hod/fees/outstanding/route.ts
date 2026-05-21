import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Only HOD can view outstanding payments
    if (user.role !== "HOD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "100");

    // Fetch all outstanding fees with student details
    // This includes: fees marked as "Outstanding" type OR any unpaid/overdue fees
    const outstandingFees = await db.fee.findMany({
      where: {
        OR: [
          // Explicitly marked as Outstanding type
          { type: "Outstanding" },
          // OR fees that are unpaid (paidAmount < amount)
          {
            AND: [
              { status: { in: ["PENDING", "OVERDUE"] } },
            ],
          },
        ],
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { dueDate: "desc" },
      take: limit,
    });

    // Filter to only include fees where paidAmount < amount (truly outstanding)
    const filtered = outstandingFees.filter(
      (fee) => Number(fee.paidAmount) < Number(fee.amount)
    );

    // Format response
    const formatted = filtered.map((fee) => ({
      id: fee.id,
      studentId: fee.studentId,
      studentName: fee.student?.name || "Unknown",
      studentEmail: fee.student?.email || "Unknown",
      amount: Number(fee.amount),
      paidAmount: Number(fee.paidAmount),
      remainingAmount: Number(fee.amount) - Number(fee.paidAmount),
      reason: fee.term, // Outstanding fees use term field for reason
      status: fee.status,
      dueDate: fee.dueDate,
      createdAt: fee.dueDate, // Use dueDate as createdAt since Fee model doesn't have createdAt
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Outstanding Fees GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
