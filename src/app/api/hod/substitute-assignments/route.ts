import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "HOD") {
      return NextResponse.json(
        { error: "Unauthorized. Only HOD can access this." },
        { status: 403 }
      );
    }

    const { absentStaffId, substituteStaffId, classEnrolled, leaveId } = await req.json();

    if (!absentStaffId || !substituteStaffId || !classEnrolled) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (absentStaffId === substituteStaffId) {
      return NextResponse.json(
        { error: "Cannot assign the same staff as substitute" },
        { status: 400 }
      );
    }

    // Check substitute is not on active approved leave today
    const today = new Date();
    const dayStart = new Date(today); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today); dayEnd.setHours(23, 59, 59, 999);

    // If leaveId provided, check for that leave's date range; otherwise check today
    let checkDate = { lte: dayEnd, gte: dayStart };
    if (leaveId) {
      try {
        const leave = await db.leaveRequest.findUnique({ where: { id: leaveId } });
        if (leave) {
          const leaveDay = new Date(leave.fromDate);
          const leaveStart = new Date(leaveDay); leaveStart.setHours(0, 0, 0, 0);
          const leaveEnd = new Date(leaveDay); leaveEnd.setHours(23, 59, 59, 999);
          checkDate = { lte: leaveEnd, gte: leaveStart };
        }
      } catch {
        // ignore — use today's date
      }
    }

    const activeLeave = await db.leaveRequest.findFirst({
      where: {
        staffId: substituteStaffId,
        status: "APPROVED",
        fromDate: { lte: checkDate.lte },
        toDate: { gte: checkDate.gte },
      },
    });

    if (activeLeave) {
      return NextResponse.json(
        { error: "Selected substitute is currently on approved leave and cannot be assigned" },
        { status: 400 }
      );
    }

    // Find or create substitute assignment associated with this leave
    const parsedLeaveId = leaveId ? parseInt(String(leaveId)) : null;
    const cleanLeaveId = parsedLeaveId && !isNaN(parsedLeaveId) ? parsedLeaveId : null;

    const existing = await db.substituteAssignment.findFirst({
      where: { 
        absentStaffId, 
        classEnrolled,
        leaveId: cleanLeaveId
      },
    });

    let assignment;
    let oldSubstituteStaffId: number | null = null;
    if (existing) {
      oldSubstituteStaffId = existing.substituteStaffId;
      assignment = await db.substituteAssignment.update({
        where: { id: existing.id },
        data: { 
          substituteStaffId,
          leaveId: cleanLeaveId
        },
      });
    } else {
      assignment = await db.substituteAssignment.create({
        data: { 
          absentStaffId, 
          substituteStaffId, 
          classEnrolled,
          leaveId: cleanLeaveId
        },
      });
    }

    // Send notifications (best-effort, won't fail the whole request)
    try {
      const absentStaff = await db.staff.findUnique({
        where: { id: absentStaffId },
        select: { name: true },
      });
      const sub = await db.staff.findUnique({
        where: { id: substituteStaffId },
        select: { name: true },
      });
      const absentName = absentStaff?.name || "Teacher";
      const subName = sub?.name || "Substitute";

      // 1. Notify the newly assigned substitute
      await db.notification.create({
        data: {
          staffId: substituteStaffId,
          type: "GENERAL",
          title: "Substitute assigned",
          message: `You are assigned as substitute for ${absentName} (${classEnrolled}).`,
        } as any,
      });

      // 2. Notify the old substitute teacher ("old assign goes notification in bell")
      if (oldSubstituteStaffId && oldSubstituteStaffId !== substituteStaffId) {
        try {
          await db.notification.create({
            data: {
              staffId: oldSubstituteStaffId,
              type: "GENERAL",
              title: "Substitute assignment changed",
              message: `Your substitute assignment for ${absentName} (${classEnrolled}) has been reassigned/cancelled.`,
            } as any,
          });
        } catch (e) {
          console.error("Failed to notify old substitute:", e);
        }
      }

      const students = await db.student.findMany({
        where: { classEnrolled, isActive: true },
        select: { id: true },
      });
      if (students.length > 0) {
        await db.notification.createMany({
          data: students.map((s) => ({
            studentId: s.id,
            type: "GENERAL" as const,
            title: "Substitute teacher assigned",
            message: `${subName} will take classes for ${classEnrolled}. Please check timetable.`,
          })),
        });
      }
    } catch (e) {
      console.error("Failed to create substitute notifications:", e);
    }

    return NextResponse.json({ message: "Substitute assigned successfully", assignment });
  } catch (error) {
    console.error("Error assigning substitute:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "HOD") {
      return NextResponse.json(
        { error: "Unauthorized. Only HOD can access this." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const absentStaffId = searchParams.get("absentStaffId");
    const leaveId = searchParams.get("leaveId");

    if (!absentStaffId) {
      return NextResponse.json({ error: "Missing absentStaffId parameter" }, { status: 400 });
    }

    const parsedLeaveId = leaveId ? parseInt(leaveId) : null;
    const cleanLeaveId = parsedLeaveId && !isNaN(parsedLeaveId) ? parsedLeaveId : null;

    const deleteWhereClause: any = {
      absentStaffId: parseInt(absentStaffId)
    };
    if (cleanLeaveId !== null) {
      deleteWhereClause.leaveId = cleanLeaveId;
    }

    // Find substitute assignments before deleting to notify the "old assign" substitute(s)
    const assignmentsToDelete = await db.substituteAssignment.findMany({
      where: deleteWhereClause,
      include: { absentStaff: true }
    });

    if (assignmentsToDelete.length > 0) {
      await db.substituteAssignment.deleteMany({
        where: deleteWhereClause,
      });

      // Send cancellation notifications to the old substitutes
      for (const assignment of assignmentsToDelete) {
        try {
          await db.notification.create({
            data: {
              staffId: assignment.substituteStaffId,
              type: "GENERAL",
              title: "Substitute assignment cancelled",
              message: `Your substitute assignment for ${assignment.absentStaff.name} (${assignment.classEnrolled}) has been removed/cancelled.`,
            } as any,
          });
        } catch (e) {
          console.error("Failed to notify deleted substitute:", e);
        }
      }
    }

    return NextResponse.json({ message: "Substitute removed successfully" });
  } catch (error) {
    console.error("Error removing substitute:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
