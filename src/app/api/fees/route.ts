import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateOverdueFees } from "@/lib/feeStatus";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string };
    const studentId = parseInt(user.id);

    // Phase 2: Automatically update overdue fees before returning
    await updateOverdueFees();

    const fees = await db.fee.findMany({
      where: { studentId },
      orderBy: { dueDate: "asc" },
    });

    // Compute totals using Decimal for precision
    const totalDue = fees.reduce((acc, f) => acc + Number(f.amount), 0);
    const totalPaid = fees.reduce((acc, f) => acc + Number(f.paidAmount), 0);
    const outstanding = totalDue - totalPaid;

    return NextResponse.json({
      records: fees,
      summary: {
        totalDue: parseFloat(totalDue.toFixed(2)),
        totalPaid: parseFloat(totalPaid.toFixed(2)),
        outstanding: parseFloat(outstanding.toFixed(2)),
      }
    });
  } catch (error) {
    console.error("Fees API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
