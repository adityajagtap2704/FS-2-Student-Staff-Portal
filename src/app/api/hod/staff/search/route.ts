import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "HOD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url   = new URL(req.url);
    const query = (url.searchParams.get("q") ?? "").trim();

    if (!query) return NextResponse.json([]);

    const staff = await db.staff.findMany({
      where: {
        OR: [
          { name:          { contains: query } },
          { email:         { contains: query } },
          { assignedClass: { contains: query } },
        ],
      },
      select: {
        id:            true,
        name:          true,
        email:         true,
        role:          true,
        assignedClass: true,
        isActive:      true,
      },
      orderBy: { name: "asc" },
      take: 8,
    });

    // Enrich with student count and pending leave count
    const enriched = await Promise.all(
      staff.map(async (s) => {
        const studentCount = s.assignedClass
          ? await db.student.count({ where: { classEnrolled: s.assignedClass } })
          : 0;

        const pendingLeaveCount = await db.leaveRequest.count({
          where: { staffId: s.id, status: "PENDING" },
        });

        // Check if on leave today
        const now      = new Date();
        const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
        const dayEnd   = new Date(now); dayEnd.setHours(23, 59, 59, 999);
        const activeLeave = await db.leaveRequest.findFirst({
          where: {
            staffId:  s.id,
            status:   "APPROVED",
            fromDate: { lte: dayEnd },
            toDate:   { gte: dayStart },
          },
        });

        return {
          ...s,
          studentCount,
          pendingLeaveCount,
          isOnLeave: !!activeLeave,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("HOD Staff Search Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
