import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    if (user.role !== "HOD") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = parseInt(params.id);
    const body = await req.json();

    const entry = await db.timetableEntry.update({
      where: { id },
      data: {
        subjectId: body.subjectId ?? undefined,
        staffId: body.staffId ?? undefined,
        classroomId: body.classroomId ?? undefined,
        isPublished: body.isPublished ?? undefined,
      },
      include: { slot: true, subject: true, classroom: true },
    });

    return NextResponse.json({ entry });
  } catch (err: any) {
    console.error("PATCH /api/timetable/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    if (user.role !== "HOD") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = parseInt(params.id);
    await db.timetableEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/timetable/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
