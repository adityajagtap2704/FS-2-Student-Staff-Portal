import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLeaveBalance } from "@/lib/leaveBalance";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || (user?.role !== "CLASS_TEACHER" && user?.role !== "HOD")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let whereClause: any = {};

    // CLASS_TEACHER can only see their assigned class's students
    if (user.role === "CLASS_TEACHER" && user.assignedClass) {
      whereClause = {
        student: {
          classEnrolled: user.assignedClass,
        },
      };
    }
    // HOD can see all student leave requests

    // Fetch all student leave requests
    const leaveRequests = await db.leaveRequest.findMany({
      where: {
        studentId: { not: null },
        ...whereClause,
      },
      include: {
        student: {
          select: {
            name: true,
            rollNumber: true,
            classEnrolled: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    // Enrich with leave balance for each student
    const result = await Promise.all(
      leaveRequests.map(async (lr: any) => {
        const balance = lr.studentId ? await getLeaveBalance(lr.studentId) : null;
        return { ...lr, leaveBalance: balance };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Staff Student Leaves Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
