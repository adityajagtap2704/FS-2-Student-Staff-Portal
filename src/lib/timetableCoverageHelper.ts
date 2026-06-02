import db from "@/lib/db";

/**
 * Get all days between two dates (inclusive)
 */
export function getDaysBetween(fromDate: Date, toDate: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(fromDate);
  current.setHours(0, 0, 0, 0);
  
  const end = new Date(toDate);
  end.setHours(0, 0, 0, 0);
  
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

/**
 * Get day of week (1 = Monday, 6 = Saturday)
 */
export function getDayOfWeek(date: Date): number {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return day === 0 ? 7 : day; // Convert to 1-7 (Mon-Sun)
}

function toYMDLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Check coverage for a leave request
 * Returns list of uncovered slots that need substitute assignments
 */
export async function checkLeaveCoverage(
  staffId: number,
  fromDate: Date,
  toDate: Date,
  academicYear: string = "2025-26"
) {
  const days = getDaysBetween(fromDate, toDate);
  const uncoveredSlots: any[] = [];
  const coveredSlots: any[] = [];

  // Find matching leave request to get its ID
  const leave = await db.leaveRequest.findFirst({
    where: {
      staffId,
      fromDate: { lte: toDate },
      toDate: { gte: fromDate },
      status: "APPROVED",
    },
  });
  
  for (const date of days) {
    const dayOfWeek = getDayOfWeek(date);
    
    // Find all timetable entries for this staff on this day of week
    const slots = await db.timetableEntry.findMany({
      where: {
        staffId,
        dayOfWeek,
        academicYear,
      },
      include: {
        slot: true,
        subject: true,
        classroom: true,
      },
    });

    for (const slot of slots) {
      // Check if substitute is already assigned for this class and leave
      const substitute = await db.substituteAssignment.findFirst({
        where: {
          absentStaffId: staffId,
          classEnrolled: slot.classEnrolled ?? undefined,
          leaveId: leave?.id || undefined,
        },
        include: {
          substituteStaff: true,
        },
      });

      const slotInfo = {
        date,
        dayOfWeek,
        timetableEntryId: slot.id,
        classEnrolled: slot.classEnrolled,
        section: slot.section,
        slotTime: `${slot.slot.startTime} - ${slot.slot.endTime}`,
        slotNumber: slot.slot.slotNumber,
        subject: slot.subject?.name || "N/A",
        classroom: slot.classroom?.name || "N/A",
      };

      if (substitute) {
        coveredSlots.push({
          ...slotInfo,
          status: "COVERED",
          substituteStaffId: substitute.substituteStaffId,
          substituteStaffName: substitute.substituteStaff.name,
          assignedAt: substitute.assignedAt,
        });
      } else {
        uncoveredSlots.push({
          ...slotInfo,
          status: "UNCOVERED",
        });
      }
    }
  }

  return {
    totalSlots: uncoveredSlots.length + coveredSlots.length,
    uncoveredSlots,
    coveredSlots,
    coverageStatus: uncoveredSlots.length === 0 ? "FULLY_COVERED" : uncoveredSlots.length === coveredSlots.length + uncoveredSlots.length ? "NEEDS_ATTENTION" : "PARTIALLY_COVERED",
  };
}

/**
 * Get staff details for a leave date in a class timetable
 */
export async function getLeaveAffectedStaffForDate(
  classEnrolled: string,
  date: Date,
  academicYear: string = "2025-26"
) {
  // Normalize to local day boundaries to avoid timezone/date-shift issues
  // (especially when UI sends YYYY-MM-DD parsed as UTC).
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const dayOfWeek = getDayOfWeek(dayStart);
  
  // Find all leave requests that cover this date
  const leaveRequests = await db.leaveRequest.findMany({
    where: {
      staff: {
        isActive: true,
      },
      status: "APPROVED",
      fromDate: {
        // Leave is active if it started on/before this day (any time)
        lte: dayEnd,
      },
      toDate: {
        // Leave is active if it ends on/after this day (any time)
        gte: dayStart,
      },
    },
    include: {
      staff: {
        select: {
          id: true,
          name: true,
          email: true,
          assignedClass: true,
        },
      },
    },
  });

  // Re-filter by local calendar day to prevent timezone/time-part from extending leave into the next day.
  const targetYMD = toYMDLocal(dayStart);
  const normalizedLeaveRequests = leaveRequests.filter((leave: any) => {
    const fromYMD = toYMDLocal(new Date(leave.fromDate));
    const toYMD = toYMDLocal(new Date(leave.toDate));
    return fromYMD <= targetYMD && toYMD >= targetYMD;
  });

  // For each leave request, find affected timetable entries in this class
  const affectedSlots: any[] = [];

  for (const leave of normalizedLeaveRequests) {
    if (!leave.staffId) continue; // Prisma type can be nullable
    const slots = await db.timetableEntry.findMany({
      where: {
        classEnrolled,
        dayOfWeek,
        staffId: leave.staffId,
        academicYear,
      },
      include: {
        slot: true,
        subject: true,
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    for (const slot of slots) {
      // Check for substitute assignment
      const substitute = await db.substituteAssignment.findFirst({
        where: {
          absentStaffId: leave.staffId,
          classEnrolled,
          leaveId: leave.id,
        },
        include: {
          substituteStaff: true,
        },
      });

      affectedSlots.push({
        timetableEntryId: slot.id,
        slotNumber: slot.slot.slotNumber,
        slotTime: `${slot.slot.startTime} - ${slot.slot.endTime}`,
        subject: slot.subject?.name || "N/A",
        absentStaffId: leave.staffId,
        absentStaffName: slot.staff?.name || "N/A",
        leaveId: leave.id,
        leaveFromDate: leave.fromDate,
        leaveToDate: leave.toDate,
        hasCoverage: !!substitute,
        substituteStaffName: substitute?.substituteStaff.name || null,
        substituteStaffId: substitute?.substituteStaffId || null,
        coverageStatus: substitute ? "COVERED" : "UNCOVERED",
      });
    }
  }

  return affectedSlots;
}

/**
 * Check if a substitute teacher is available (not on leave) for a specific date
 */
export async function isSubstituteAvailable(
  substituteStaffId: number,
  date: Date
): Promise<boolean> {
  // Normalize to local day boundaries
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const dayOfWeek = getDayOfWeek(dayStart);
  
  const activeLeave = await db.leaveRequest.findFirst({
    where: {
      staffId: substituteStaffId,
      status: "APPROVED",
      fromDate: {
        lte: dayEnd,
      },
      toDate: {
        gte: dayStart,
      },
    },
  });

  if (!activeLeave) return true;

  // Ensure it covers the target local calendar day.
  const targetYMD = toYMDLocal(dayStart);
  const fromYMD = toYMDLocal(new Date(activeLeave.fromDate));
  const toYMD = toYMDLocal(new Date(activeLeave.toDate));

  const isActuallyOnLeave = fromYMD <= targetYMD && toYMD >= targetYMD;
  return !isActuallyOnLeave;
}

/**
 * Get available substitutes for a class (not on leave on the specified date)
 */
export async function getAvailableSubstitutes(
  classEnrolled: string,
  date: Date
): Promise<any[]> {
  // Get all active staff except the primary teacher for this class
  const allStaff = await db.staff.findMany({
    where: {
      isActive: true,
      role: "CLASS_TEACHER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      assignedClass: true,
    },
  });

  const available = [];

  for (const staff of allStaff) {
    const isAvailable = await isSubstituteAvailable(staff.id, date);
    if (isAvailable) {
      available.push({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        assignedClass: staff.assignedClass,
      });
    }
  }

  return available;
}
