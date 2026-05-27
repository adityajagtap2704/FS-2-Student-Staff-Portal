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

    const classrooms = await db.classroom.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    // When editing a period, return only rooms not already booked in another class at this slot
    if (dayOfWeek && slotId && classEnrolled) {
      const dow = parseInt(dayOfWeek, 10);
      const sid = parseInt(slotId, 10);
      if (!Number.isNaN(dow) && !Number.isNaN(sid)) {
        const busyEntries = await db.timetableEntry.findMany({
          where: {
            dayOfWeek: dow,
            slotId: sid,
            academicYear,
            classroomId: { not: null },
            NOT: { classEnrolled, section },
          },
          select: { classroomId: true },
        });
        const busyRoomIds = new Set(
          busyEntries.map((e) => e.classroomId).filter((id): id is number => id != null)
        );
        const availableRooms = classrooms.filter((r) => !busyRoomIds.has(r.id));
        return NextResponse.json({ classrooms: availableRooms, busyRoomIds: [...busyRoomIds] });
      }
    }

    return NextResponse.json({ classrooms });
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
    const { name, capacity, building, floor } = await req.json();
    if (!name) return NextResponse.json({ error: "Room name is required" }, { status: 400 });
    const classroom = await db.classroom.create({
      data: { name, capacity: capacity ? parseInt(capacity) : 40, building: building || null, floor: floor || null },
    });
    return NextResponse.json({ classroom });
  } catch (err: any) {
    if (err.code === "P2002") return NextResponse.json({ error: "Room name already exists" }, { status: 409 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
