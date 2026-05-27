import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { getAvailableSubstitutes, isSubstituteAvailable } from "@/lib/timetableCoverageHelper";

/**
 * GET /api/timetable/coverage
 * HOD can query coverage status for a specific class and date
 * Query params: class, date (YYYY-MM-DD), date2 (optional, for date range)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    // Only HOD can access coverage info
    if (!session || user?.role !== "HOD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classEnrolled = searchParams.get("class");
    const dateStr = searchParams.get("date");
    const date2Str = searchParams.get("date2");

    if (!classEnrolled || !dateStr) {
      return NextResponse.json(
        { error: "Missing required parameters: class, date" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    let dateRange = [date];
    if (date2Str) {
      const date2 = new Date(date2Str);
      if (!isNaN(date2.getTime())) {
        const current = new Date(date);
        while (current <= date2) {
          dateRange.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      }
    }

    const coverageData: any[] = [];

    for (const singleDate of dateRange) {
      // Find all leave requests that cover this date
      const leaveRequests = await db.leaveRequest.findMany({
        where: {
          status: "APPROVED",
          fromDate: { lte: singleDate },
          toDate: { gte: singleDate },
        },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
              assignedClass: true,
              timetable_entries: {
                where: {
                  classEnrolled,
                  dayOfWeek: singleDate.getDay() === 0 ? 6 : singleDate.getDay() - 1,
                },
                include: {
                  slot: true,
                  subject: true,
                },
              },
            },
          },
        },
      });

      for (const leave of leaveRequests) {
        if (!leave.staffId) continue; // Prisma type can be nullable; skip if missing
        for (const slot of leave.staff?.timetable_entries || []) {
          // Check for existing substitute
          const substitute = await db.substituteAssignment.findFirst({
            where: {
              absentStaffId: leave.staffId,
              classEnrolled,
            },
            include: {
              substituteStaff: true,
            },
          });

          coverageData.push({
            date: singleDate.toISOString().split("T")[0],
            classEnrolled,
            slot: {
              number: slot.slot.slotNumber,
              time: `${slot.slot.startTime} - ${slot.slot.endTime}`,
            },
            absentStaff: {
              id: leave.staff?.id,
              name: leave.staff?.name,
              email: leave.staff?.email,
            },
            subject: slot.subject?.name || "N/A",
            coverage: substitute
              ? {
                  status: "COVERED",
                  substituteId: substitute.substituteStaffId,
                  substituteName: substitute.substituteStaff.name,
                  assignedAt: substitute.assignedAt,
                }
              : {
                  status: "UNCOVERED",
                  availableSubstitutes: [], // Will be filled below
                },
            leaveDetails: {
              id: leave.id,
              from: leave.fromDate.toISOString().split("T")[0],
              to: leave.toDate.toISOString().split("T")[0],
            },
          });
        }
      }
    }

    // Get available substitutes for uncovered slots
    for (let i = 0; i < coverageData.length; i++) {
      if (coverageData[i].coverage.status === "UNCOVERED") {
        const availableSubstitutes = await getAvailableSubstitutes(
          classEnrolled,
          new Date(coverageData[i].date)
        );
        coverageData[i].coverage.availableSubstitutes = availableSubstitutes;
      }
    }

    return NextResponse.json({
      date: dateStr,
      dateRange: date2Str ? `${dateStr} to ${date2Str}` : dateStr,
      classEnrolled,
      coverageData,
      summary: {
        totalSlots: coverageData.length,
        coveredSlots: coverageData.filter((c) => c.coverage.status === "COVERED").length,
        uncoveredSlots: coverageData.filter((c) => c.coverage.status === "UNCOVERED").length,
      },
    });
  } catch (error) {
    console.error("GET /api/timetable/coverage error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/timetable/coverage/assign-substitute
 * Assign a substitute teacher to cover a slot
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || user?.role !== "HOD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { absentStaffId, substituteStaffId, classEnrolled, leaveId } = body;

    if (!absentStaffId || !substituteStaffId || !classEnrolled) {
      return NextResponse.json(
        { error: "Missing required fields: absentStaffId, substituteStaffId, classEnrolled" },
        { status: 400 }
      );
    }

    // Verify substitute is available
    const leave = await db.leaveRequest.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    const isAvailable = await isSubstituteAvailable(substituteStaffId, leave.fromDate);
    if (!isAvailable) {
      return NextResponse.json(
        { error: "Selected substitute is not available on the leave date" },
        { status: 400 }
      );
    }

    // Create or update substitute assignment
    const existing = await db.substituteAssignment.findFirst({
      where: {
        absentStaffId,
        classEnrolled,
      },
    });

    let assignment;
    if (existing) {
      assignment = await db.substituteAssignment.update({
        where: { id: existing.id },
        data: { substituteStaffId },
        include: {
          substituteStaff: true,
          absentStaff: true,
        },
      });
    } else {
      assignment = await db.substituteAssignment.create({
        data: {
          absentStaffId,
          substituteStaffId,
          classEnrolled,
        },
        include: {
          substituteStaff: true,
          absentStaff: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${assignment.substituteStaff.name} assigned as substitute for ${assignment.absentStaff.name}`,
      assignment,
    });
  } catch (error) {
    console.error("POST /api/timetable/coverage error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
