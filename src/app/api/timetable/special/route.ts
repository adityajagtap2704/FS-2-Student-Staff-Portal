import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const classEnrolled = searchParams.get("class");

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const user = session.user as any;
    let whereClause: any = { date: { gte: startDate, lte: endDate } };

    if (user.role === "STUDENT") {
      const student = await db.student.findUnique({ where: { id: parseInt(user.id) } });
      whereClause.OR = [
        { classEnrolled: null },
        { classEnrolled: student?.classEnrolled },
      ];
    } else if (classEnrolled) {
      whereClause.OR = [{ classEnrolled: null }, { classEnrolled }];
    }

    const schedules = await db.specialSchedule.findMany({
      where: whereClause,
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ schedules });
  } catch (err: any) {
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
    const schedule = await db.specialSchedule.create({
      data: {
        date: new Date(body.date),
        title: body.title,
        description: body.description || null,
        type: body.type || "EVENT",
        classEnrolled: body.classEnrolled || null,
        section: body.section || null,
        createdBy: parseInt(user.id),
      },
    });

    return NextResponse.json({ schedule });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    if (user.role !== "HOD") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    await db.specialSchedule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
