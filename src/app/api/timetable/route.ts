import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const classEnrolled = searchParams.get("class");
    const section = searchParams.get("section") || "A";
    const staffId = searchParams.get("staffId");
    const academicYear = searchParams.get("year");

    const user = session.user as any;
    let whereClause: any = {};

    // Only filter by academicYear if explicitly provided
    if (academicYear) {
      whereClause.academicYear = academicYear;
    }

    if (user.role === "STUDENT") {
      const student = await db.student.findUnique({ where: { id: parseInt(user.id) } });
      if (!student?.classEnrolled) return NextResponse.json({ entries: [], slots: [] });
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

    return NextResponse.json({ entries, slots, subjects, classrooms, staff });
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

    // Conflict detection: same teacher, same slot, same day
    if (staffId) {
      const teacherConflict = await db.timetableEntry.findFirst({
        where: { staffId, dayOfWeek, slotId, academicYear: year, NOT: { classEnrolled, section } },
      });
      if (teacherConflict) {
        return NextResponse.json({
          error: `Teacher conflict: This teacher is already assigned to ${teacherConflict.classEnrolled} at this time.`,
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

    return NextResponse.json({ entry });
  } catch (err: any) {
    console.error("POST /api/timetable error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
