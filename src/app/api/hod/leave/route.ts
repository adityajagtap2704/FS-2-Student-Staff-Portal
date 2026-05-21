import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLeaveBalance } from "@/lib/leaveBalance";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user    = session?.user as any;
    if (!session || user?.role !== "HOD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all student leave requests (where studentId is not null)
    const leaveRequests = await db.leaveRequest.findMany({
      where: {
        studentId: { not: null },
      },
      include: { 
        student: { 
          select: { 
            name: true, 
            rollNumber: true, 
            classEnrolled: true 
          } 
        } 
      },
      orderBy: { submittedAt: "desc" },
    });

    const result = await Promise.all(
      leaveRequests.map(async (lr) => {
        const balance = lr.studentId ? await getLeaveBalance(lr.studentId) : null;
        return { ...lr, leaveBalance: balance };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("HOD Leave Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
