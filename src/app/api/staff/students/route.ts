import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { countDays, MONTHLY_LIMIT, YEARLY_LIMIT } from "@/lib/leaveBalance";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user    = session?.user as any;
    
    console.log("[STAFF STUDENTS] Session user:", { id: user?.id, role: user?.role, assignedClass: user?.assignedClass });
    
    if (!session || user?.role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const assignedClass = user.assignedClass as string;
    
    if (!assignedClass) {
      console.log("[STAFF STUDENTS] ERROR: assignedClass is null/undefined");
      return NextResponse.json({ error: "Teacher has no assigned class" }, { status: 400 });
    }
    
    console.log("[STAFF STUDENTS] Looking for students in class:", assignedClass);

    // Get current year for leave balance calculation
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // Filter students by assigned class and get leave data
    const students = await db.student.findMany({
      where: { classEnrolled: assignedClass },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        parentName: true,
        rollNumber: true,
        classEnrolled: true,
        status: true,
        isActive: true,
        leaveRequests: {
          select: {
            id: true,
            fromDate: true,
            toDate: true,
            status: true,
            submittedAt: true,
          },
          where: {
            submittedAt: {
              gte: new Date(currentYear, 0, 1),
              lt: new Date(currentYear + 1, 0, 1),
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate leave balance for each student using proper countDays function
    const studentsWithLeaveBalance = students.map(student => {
      const approvedLeaves = student.leaveRequests.filter(lr => lr.status === "APPROVED");
      
      // Calculate yearly used using proper countDays function
      let yearlyUsed = 0;
      approvedLeaves.forEach(leave => {
        yearlyUsed += countDays(leave.fromDate, leave.toDate);
      });

      // Calculate monthly used for current month
      let monthlyUsed = 0;
      approvedLeaves.forEach(leave => {
        const leaveFromDate = new Date(leave.fromDate);
        const leaveToDate = new Date(leave.toDate);
        
        // Check if leave overlaps with current month
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);
        
        if (leaveFromDate <= monthEnd && leaveToDate >= monthStart) {
          // Calculate days that fall in current month
          const effectiveFrom = leaveFromDate > monthStart ? leaveFromDate : monthStart;
          const effectiveTo = leaveToDate < monthEnd ? leaveToDate : monthEnd;
          monthlyUsed += countDays(effectiveFrom, effectiveTo);
        }
      });

      return {
        ...student,
        leaveBalance: {
          monthlyUsed,
          monthlyLimit: MONTHLY_LIMIT,
          monthlyRemaining: Math.max(0, MONTHLY_LIMIT - monthlyUsed),
          yearlyUsed,
          yearlyLimit: YEARLY_LIMIT,
          yearlyRemaining: Math.max(0, YEARLY_LIMIT - yearlyUsed),
        },
        leaveRequests: undefined, // Remove the raw leave requests from response
      };
    });

    console.log("[STAFF STUDENTS] Found students:", studentsWithLeaveBalance.length);
    return NextResponse.json(studentsWithLeaveBalance);
  } catch (error) {
    console.error("Staff Students Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
