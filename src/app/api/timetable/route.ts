import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { getLeaveAffectedStaffForDate, getDayOfWeek } from "@/lib/timetableCoverageHelper";

export const dynamic = "force-dynamic";

const DOW = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

    let [entries, slots, subjects, classrooms, staff] = await Promise.all([
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

    // Fetch substitute assignments if staffId is provided
    if (staffId) {
      try {
        const targetDate = viewDate ? new Date(viewDate + "T12:00:00") : new Date();
        const dayStart = new Date(targetDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(23, 59, 59, 999);
        const jsDay = targetDate.getDay();
        const targetDow = jsDay === 0 ? 7 : jsDay;

        const activeLeaves = await db.leaveRequest.findMany({
          where: {
            status: "APPROVED",
            fromDate: { lte: dayEnd },
            toDate: { gte: dayStart }
          },
          select: { id: true, staffId: true }
        });

        if (activeLeaves.length > 0) {
          const activeSubs = await db.substituteAssignment.findMany({
            where: {
              substituteStaffId: parseInt(staffId),
              leaveId: { in: activeLeaves.map(l => l.id) }
            }
          });

          if (activeSubs.length > 0) {
            const subEntries = await db.timetableEntry.findMany({
              where: {
                classEnrolled: { in: activeSubs.map(s => s.classEnrolled) },
                dayOfWeek: targetDow,
                staffId: { in: activeSubs.map(s => s.absentStaffId) }
              },
              include: {
                slot: true,
                subject: true,
                classroom: true
              }
            });

            const substituteEntries = subEntries.map((e: any) => ({
              ...e,
              isSubstitution: true,
              substitutedForStaffId: e.staffId,
              staffId: parseInt(staffId)
            }));

            entries = [...entries, ...substituteEntries];
          }
        }
      } catch (err) {
        console.error("Failed to fetch substitute entries for staff timetable:", err);
      }
    }

    // Apply substitute teacher for a specific date:
    // - For HOD: only when ?date=YYYY-MM-DD is provided (preview tomorrow)
    // - For Student/Staff: apply for today by default, or for ?date when provided
    const shouldApplySubstitutes =
      (user.role === "HOD" && classEnrolled && viewDate) ||
      user.role === "STUDENT" ||
      (!!staffId);

    if (shouldApplySubstitutes) {
      try {
        const targetDate =
          viewDate ? new Date(viewDate + "T12:00:00") : new Date();
        const dayStart = new Date(targetDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(23, 59, 59, 999);
        // TimetableEntry.dayOfWeek uses JS-style mapping: Mon=1..Sat=6 (Sunday=7).
        // Use the same mapping here so substitutes apply to the correct weekday.
        const jsDay = targetDate.getDay(); // 0=Sun..6=Sat
        const targetDow = jsDay === 0 ? 7 : jsDay;

        const classForSubs =
          user.role === "STUDENT"
            ? whereClause.classEnrolled
            : (classEnrolled || null);

        if (classForSubs) {
          const staffIdsInEntries = Array.from(
            new Set(entries.map((e: any) => e.staffId).filter((id: any) => id != null))
          ) as number[];

          if (staffIdsInEntries.length > 0) {
            const leaves = await db.leaveRequest.findMany({
              where: {
                staffId: { in: staffIdsInEntries },
                status: "APPROVED",
                fromDate: { lte: dayEnd },
                toDate: { gte: dayStart },
              },
              select: { id: true, staffId: true },
            });

            if (leaves.length > 0) {
              const leaveIds = leaves.map((l) => l.id);
              let subs: any[] = [];
              subs = await db.substituteAssignment.findMany({
                where: {
                  classEnrolled: classForSubs,
                  leaveId: { in: leaveIds },
                },
                select: { leaveId: true, absentStaffId: true, substituteStaffId: true },
              });

              const leaveByStaff = new Map(leaves.map((l) => [l.staffId, l.id]));
              // Build subByAbsent map (staff who is absent -> substitute)
              const subByAbsent = new Map<number, number>();
              const subByLeave = new Map<number, number>();
              subs.forEach((s: any) => {
                if (s.leaveId) subByLeave.set(s.leaveId, s.substituteStaffId);
                if (s.absentStaffId) subByAbsent.set(s.absentStaffId, s.substituteStaffId);
              });

              // Replace staffId in the entries for the target day only
              entries.forEach((e: any) => {
                if (!e.staffId) return;
                if (e.dayOfWeek !== targetDow) return;
                const leaveIdForStaff = leaveByStaff.get(e.staffId);
                if (!leaveIdForStaff) return;
                // Try leaveId-based lookup first, then fall back to absentStaffId
                const subId = subByLeave.get(leaveIdForStaff) ?? subByAbsent.get(e.staffId);
                if (!subId) return;
                e.substitutedForStaffId = e.staffId;
                e.staffId = subId;
              });
            }
          }
        }
      } catch (e) {
        console.error("Failed to apply substitutes to timetable:", e);
      }
    }

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

    const response = NextResponse.json({ 
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
    // TIMETABLE UPDATE FIX: Ensure no browser/CDN caching of timetable data
    // so students see updates immediately when HOD publishes changes
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
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
    const { classEnrolled, section = "A", dayOfWeek, slotId, subjectId, staffId, classroomId, academicYear, isPublished } = body;

    if (!classEnrolled || !dayOfWeek || !slotId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use provided academicYear or default to "2025-26"
    const year = academicYear || "2025-26";

    // If this class+section+year timetable is already published, new/updated entries must remain published
    // so that students immediately see HOD changes without requiring re-publish.
    const publishedExists = await db.timetableEntry.findFirst({
      where: { classEnrolled, section, academicYear: year, isPublished: true },
      select: { id: true },
    });
    const shouldBePublished = !!publishedExists || !!isPublished;

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

    const prevStaffId = existing?.staffId ?? null;

    let entry;
    if (existing) {
      entry = await db.timetableEntry.update({
        where: { id: existing.id },
        data: {
          subjectId: subjectId || null,
          staffId: staffId || null,
          classroomId: classroomId || null,
          // Preserve published state if timetable is published
          ...(shouldBePublished ? { isPublished: true } : {}),
        },
        include: { slot: true, subject: true, classroom: true },
      });
    } else {
      entry = await db.timetableEntry.create({
        data: {
          classEnrolled,
          section,
          dayOfWeek,
          slotId,
          subjectId: subjectId || null,
          staffId: staffId || null,
          classroomId: classroomId || null,
          academicYear: year,
          isPublished: shouldBePublished,
        },
        include: { slot: true, subject: true, classroom: true },
      });
    }

    const period = entry.slot?.slotNumber != null ? `Period ${entry.slot.slotNumber}` : "a period";
    const time =
      entry.slot?.startTime && entry.slot?.endTime
        ? `${entry.slot.startTime}-${entry.slot.endTime}`
        : "";
    const subjectName = entry.subject?.name || "Subject";
    const roomName = entry.classroom?.name || "Room";
    const dayName = DOW[dayOfWeek] || `Day ${dayOfWeek}`;
    const scheduleDetail = `${dayName} ${period}${time ? ` (${time})` : ""}`;

    const timetableChanged =
      !existing ||
      existing.staffId !== (staffId || null) ||
      existing.subjectId !== (subjectId || null) ||
      existing.classroomId !== (classroomId || null);

    // In-app bell notification for staff when HOD assigns/changes a teacher
    if (staffId && staffId !== prevStaffId) {
      try {
        await db.notification.create({
          data: {
            staffId,
            type: "GENERAL",
            title: "New timetable assignment",
            message: `You are assigned to teach ${subjectName} for ${classEnrolled} (${section}) on ${scheduleDetail} in ${roomName}.`,
          } as any,
        });
      } catch (e) {
        console.error("Failed to create staff timetable notification:", e);
      }
    }

    // Notify students in this class when published timetable is updated
    if (shouldBePublished && timetableChanged) {
      try {
        const teacher = staffId
          ? await db.staff.findUnique({ where: { id: staffId }, select: { name: true } })
          : null;
        const teacherLine = teacher?.name ? ` Teacher: ${teacher.name}.` : "";
        const studentMsg = `${subjectName} on ${scheduleDetail} in ${roomName}.${teacherLine} Check your timetable for details.`;

        const students = await db.student.findMany({
          where: { classEnrolled, isActive: true },
          select: { id: true },
        });

        if (students.length > 0) {
          await db.notification.createMany({
            data: students.map((s) => ({
              studentId: s.id,
              type: "GENERAL" as const,
              title: "Timetable updated",
              message: studentMsg,
            })),
          });
        }
      } catch (e) {
        console.error("Failed to create student timetable notifications:", e);
      }
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
