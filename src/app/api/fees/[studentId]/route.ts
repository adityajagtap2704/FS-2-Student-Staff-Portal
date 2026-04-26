import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    const studentId = parseInt(params.studentId);
    if (isNaN(studentId)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }

    const fees = await db.fee.findMany({
      where: { studentId },
      orderBy: { dueDate: "asc" },
    });

    // Calculate per-record outstanding and totals
    const records = fees.map(fee => ({
      ...fee,
      outstanding: Number(fee.amount) - Number(fee.paidAmount),
    }));

    const totalDue = fees.reduce((acc, f) => acc + Number(f.amount), 0);
    const totalPaid = fees.reduce((acc, f) => acc + Number(f.paidAmount), 0);
    const outstanding = totalDue - totalPaid;

    return NextResponse.json({
      records,
      summary: {
        totalDue,
        totalPaid,
        outstanding
      }
    });
  } catch (error) {
    console.error("Fees API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}