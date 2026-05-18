import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLeaveBalance } from "@/lib/leaveBalance";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user    = session?.user as any;
    if (!session || user?.role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!user.assignedClass) {
      return NextResponse.json([]); // No assigned class, no students
    }

    const leaveRequests = await db.leaveRequest.findMany({
      where: {
        student: {
          classEnrolled: user.assignedClass
        }
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
    console.error("Staff Student Leave Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
