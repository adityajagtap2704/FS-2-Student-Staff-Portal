import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    if (user.role !== "HOD") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { classEnrolled, section = "A", isPublished, academicYear } = await req.json();

    const whereClause: any = { classEnrolled, section };
    if (academicYear) {
      whereClause.academicYear = academicYear;
    }

    await db.timetableEntry.updateMany({
      where: whereClause,
      data: { isPublished },
    });

    return NextResponse.json({ success: true, message: `Timetable ${isPublished ? "published" : "unpublished"} for ${classEnrolled}` });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
