import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const dayOfWeek = searchParams.get("dayOfWeek");
    const slotId = searchParams.get("slotId");
    const classEnrolled = searchParams.get("class");
    const section = searchParams.get("section") || "A";
    const academicYear = searchParams.get("year") || "2025-26";

    const staff = await db.staff.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true, assignedClass: true },
      orderBy: { name: "asc" },
    });

    // When editing a period, return only teachers not already booked in another class at this slot
    if (dayOfWeek && slotId && classEnrolled) {
      const dow = parseInt(dayOfWeek, 10);
      const sid = parseInt(slotId, 10);
      if (!Number.isNaN(dow) && !Number.isNaN(sid)) {
        const busyEntries = await db.timetableEntry.findMany({
          where: {
            dayOfWeek: dow,
            slotId: sid,
            academicYear,
            staffId: { not: null },
            NOT: { classEnrolled, section },
          },
          select: { staffId: true, classEnrolled: true },
        });
        const busyStaffIds = new Set(
          busyEntries.map((e) => e.staffId).filter((id): id is number => id != null)
        );
        const availableStaff = staff.filter((s) => !busyStaffIds.has(s.id));
        return NextResponse.json({ staff: availableStaff, busyStaffIds: [...busyStaffIds] });
      }
    }

    return NextResponse.json({ staff });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    if (user.role !== "HOD") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { name, email, assignedClass } = await req.json();
    if (!name || !email) return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    const staff = await db.staff.create({
      data: { name, email, password: "changeme123", role: "CLASS_TEACHER", assignedClass: assignedClass || null, isActive: true },
      select: { id: true, name: true, email: true, role: true, assignedClass: true },
    });
    return NextResponse.json({ staff });
  } catch (err: any) {
    if (err.code === "P2002") return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
