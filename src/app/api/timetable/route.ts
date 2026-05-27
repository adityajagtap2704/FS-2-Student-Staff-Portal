import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { getLeaveAffectedStaffForDate, getDayOfWeek } from "@/lib/timetableCoverageHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const classEnrolled = searchParams.get("class");
    const section = searchParams.get("section") || "A";
    const staffId = searchParams.get("staffId");
    const viewDate = searchParams.get("date"); // Format: YYYY-MM-DD
    const academicYear = searchParams.get("year");

    const user = session.user as any;
    let whereClause: any = {};

    // Only filter by academicYear if explicitly provided
    if (academicYear) {
      whereClause.academicYear = academicYear;
    }

    if (user.role === "STUDENT") {
      const student = await db.student.findUnique({ where: { id: parseInt(user.id) } });
      if (!student?.classEnrolled) return NextResponse.json({ entries: [], slots: [], leaveInfo: [] });
      whereClause.classEnrolled = student.classEnrolled;
      whereClause.isPublished = true;
    } else if (classEnrolled) {
      whereClause.classEnrolled = classEnrolled;
      if (section) whereClause.section = section;
    } else if (staffId) {
      whereClause.staffId = parseInt(staffId);
    }

    const [entries, slots, subjects, classrooms, staff] = await Promise.all([
      db.timetableEntry.findMany({
        where: whereClause,
        include: {
          slot: true,
          subject: true,
          classroom: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { slot: { slotNumber: "asc" } }],
      }),
      db.timetableSlot.findMany({ orderBy: { slotNumber: "asc" } }),
      db.subject.findMany({ orderBy: { name: "asc" } }),
      db.classroom.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      db.staff.findMany({ select: { id: true, name: true, assignedClass: true }, orderBy: { name: "asc" } }),
    ]);

    // CONFLICT 2 FIX: Get coverage information if HOD is viewing a class timetable on a specific date
    let leaveInfo: any = [];
    let coverageStatus: any = null;

    if (user.role === "HOD" && classEnrolled && viewDate) {
      try {
        // Parse YYYY-MM-DD safely (avoid UTC->local day shift)
        const date = new Date(viewDate + "T12:00:00");
        leaveInfo = await getLeaveAffectedStaffForDate(classEnrolled, date, academicYear || "2025-26");
        
        // Calculate coverage status
        const totalAffected = leaveInfo.length;
        const coveredCount = leaveInfo.filter((item: any) => item.hasCoverage).length;
        const uncoveredCount = totalAffected - coveredCount;

        coverageStatus = {
          date: viewDate,
          totalAffectedSlots: totalAffected,
          coveredSlots: coveredCount,
          uncoveredSlots: uncoveredCount,
          status: uncoveredCount === 0 ? "FULLY_COVERED" : uncoveredCount > 0 && coveredCount > 0 ? "PARTIALLY_COVERED" : totalAffected > 0 ? "NEEDS_ATTENTION" : "NO_LEAVES",
          message: uncoveredCount > 0 ? `⚠️ ${uncoveredCount} slot(s) need substitute assignment` : totalAffected > 0 ? "✓ All slots have coverage" : "No staff on leave",
        };
      } catch (error) {
        console.error("Error fetching leave info:", error);
      }
    }

    return NextResponse.json({ 
      entries, 
      slots, 
      subjects, 
      classrooms, 
      staff,
      // CONFLICT 2 FIX: Include coverage information for HOD timetable view
      leaveInfo,
      coverageStatus,
      conflictInfo: {
        message: "Coverage information is shown in the timetable when a specific date is provided",
        howToUse: "HOD can view coverage by adding ?date=YYYY-MM-DD parameter",
      },
    });
  } catch (err: any) {
    console.error("GET /api/timetable error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    if (user.role !== "HOD") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { classEnrolled, section = "A", dayOfWeek, slotId, subjectId, staffId, classroomId, academicYear } = body;

    if (!classEnrolled || !dayOfWeek || !slotId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use provided academicYear or default to "2025-26"
    const year = academicYear || "2025-26";

    // CONFLICT 1 FIX: Check if assigned staff is on leave for this slot
    let staffLeaveWarning = null;
    if (staffId) {
      const slot = await db.timetableSlot.findUnique({
        where: { id: slotId },
      });

      if (slot) {
        // Check for active leaves for this staff on this day of week
        const staffLeaves = await db.leaveRequest.findMany({
          where: {
            staffId,
            status: "APPROVED",
          },
        });

        for (const leave of staffLeaves) {
          // Check if this day of week falls within the leave period
          let currentDate = new Date(leave.fromDate);
          while (currentDate <= leave.toDate) {
            const currentDayOfWeek = getDayOfWeek(currentDate);
            if (currentDayOfWeek === dayOfWeek) {
              staffLeaveWarning = {
                warning: `This staff member is on approved leave during this slot's day of week`,
                staffId,
                leaveFromDate: leave.fromDate,
                leaveToDate: leave.toDate,
              };
              break;
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
          if (staffLeaveWarning) break;
        }
      }
    }

    // Conflict detection: same teacher, same slot, same day
    if (staffId) {
      const teacherConflict = await db.timetableEntry.findFirst({
        where: { staffId, dayOfWeek, slotId, academicYear: year, NOT: { classEnrolled, section } },
      });
      if (teacherConflict) {
        return NextResponse.json({
          error: `Teacher conflict: This teacher is already assigned to ${teacherConflict.classEnrolled} at this time.`,
          conflictType: "TEACHER_TIME_CONFLICT",
        }, { status: 409 });
      }
    }

    // Conflict detection: same classroom, same slot, same day
    if (classroomId) {
      const roomConflict = await db.timetableEntry.findFirst({
        where: { classroomId, dayOfWeek, slotId, academicYear: year, NOT: { classEnrolled, section } },
      });
      if (roomConflict) {
        return NextResponse.json({
          error: `Room conflict: This classroom is already booked for ${roomConflict.classEnrolled} at this time.`,
          conflictType: "CLASSROOM_CONFLICT",
        }, { status: 409 });
      }
    }

    // Upsert entry (one entry per class+section+day+slot)
    const existing = await db.timetableEntry.findFirst({
      where: { classEnrolled, section, dayOfWeek, slotId, academicYear: year },
    });

    let entry;
    if (existing) {
      entry = await db.timetableEntry.update({
        where: { id: existing.id },
        data: { subjectId: subjectId || null, staffId: staffId || null, classroomId: classroomId || null },
        include: { slot: true, subject: true, classroom: true },
      });
    } else {
      entry = await db.timetableEntry.create({
        data: { classEnrolled, section, dayOfWeek, slotId, subjectId: subjectId || null, staffId: staffId || null, classroomId: classroomId || null, academicYear: year },
        include: { slot: true, subject: true, classroom: true },
      });
    }

    const response: any = { entry };
    if (staffLeaveWarning) {
      response.staffLeaveWarning = staffLeaveWarning;
      response.message = "Entry created, but staff member has an approved leave during this day. Please review substitute assignment.";
    }

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("POST /api/timetable error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
