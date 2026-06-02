import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user    = session?.user as any;

    if (!session || user?.role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const assignedClass = user.assignedClass as string;
    if (!assignedClass) {
      return NextResponse.json({ error: "Teacher has no assigned class" }, { status: 400 });
    }

    const url   = new URL(req.url);
    const query = (url.searchParams.get("q") ?? "").trim();

    if (!query) {
      return NextResponse.json([]);
    }

    const students = await db.student.findMany({
      where: {
        classEnrolled: assignedClass,
        isActive: true,
        OR: [
          { name:       { contains: query } },
          { rollNumber: { contains: query } },
          { email:      { contains: query } },
          { phone:      { contains: query } },
          { parentName: { contains: query } },
        ],
      },
      select: {
        id:            true,
        name:          true,
        email:         true,
        phone:         true,
        parentName:    true,
        parentEmail:   true,
        classEnrolled: true,
        rollNumber:    true,
        status:        true,
        admissionDate: true,
        isActive:      true,
      },
      orderBy: { name: "asc" },
      take: 20,
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Staff Student Search Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
