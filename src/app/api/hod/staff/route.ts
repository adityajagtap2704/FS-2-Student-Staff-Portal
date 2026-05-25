import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Verify user is HOD
    if (!session?.user || (session.user as any).role !== "HOD") {
      return NextResponse.json(
        { error: "Unauthorized. Only HOD can access this." },
        { status: 403 }
      );
    }

    // Get all staff with approval status
    const staff = await db.staff.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedClass: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Add approval status based on isActive
    // PENDING = not active, APPROVED = active
    
    // 1. Calculate current time and day to determine busy staff
    const now = new Date();
    // Use local time HH:mm
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTimeString = `${hours}:${minutes}`;
    
    // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    // DB dayOfWeek: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    const currentDayOfWeek = now.getDay();
    
    // Find active slots
    const activeSlots = await db.timetableSlot.findMany({
      where: {
        startTime: { lte: currentTimeString },
        endTime: { gte: currentTimeString },
      }
    });
    
    // Collect staff IDs busy right now
    const busyStaffIds = new Set<number>();
    if (activeSlots.length > 0 && currentDayOfWeek >= 1 && currentDayOfWeek <= 6) {
      const activeSlotIds = activeSlots.map((s: any) => s.id);
      const busyEntries = await db.timetableEntry.findMany({
        where: {
          dayOfWeek: currentDayOfWeek,
          slotId: { in: activeSlotIds },
          staffId: { not: null }
        },
        select: { staffId: true }
      });
      busyEntries.forEach((entry: any) => {
        if (entry.staffId) busyStaffIds.add(entry.staffId);
      });
    }

    const staffWithStatus = await Promise.all(
      staff.map(async (s) => {
        let studentCount = 0;
        if (s.assignedClass) {
          studentCount = await db.student.count({
            where: { classEnrolled: s.assignedClass },
          });
        }

        // Check for pending leaves
        const pendingLeaveCount = await db.leaveRequest.count({
          where: {
            staffId: s.id,
            status: "PENDING",
          },
        });

        // Determine if staff is currently on leave (absent today)
        // Only APPROVED leaves where today falls within fromDate–toDate count as absent
        const today = new Date();
        today.setHours(0, 0, 0, 0); // normalize to start of day
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const activeLeave = await db.leaveRequest.findFirst({
          where: {
            staffId: s.id,
            status: "APPROVED",
            fromDate: { lte: todayEnd },
            toDate:   { gte: today },
          },
        });

        const isOnLeave = !!activeLeave;

        // Check if there is an active substitute assignment for this staff's class
        let substituteId = null;
        let substituteName = null;

        if (s.assignedClass) {
          // Find the most recent substitute assignment for this staff member
          const subAssignment = await db.substituteAssignment.findFirst({
            where: { absentStaffId: s.id },
            orderBy: { assignedAt: 'desc' },
            include: { substituteStaff: true }
          });
          
          if (subAssignment) {
            substituteId = subAssignment.substituteStaffId;
            substituteName = subAssignment.substituteStaff.name;
          }
        }

        const isBusyNow = busyStaffIds.has(s.id);
        const isFreeRightNow = !isOnLeave && !isBusyNow;

        return {
          ...s,
          approvalStatus: s.isActive ? "APPROVED" : "PENDING",
          studentCount,
          pendingLeaveCount,
          isOnLeave,
          substituteId,
          substituteName,
          isFreeRightNow,
        };
      })
    );

    // Return as array directly (not wrapped in object)
    return NextResponse.json(staffWithStatus);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
