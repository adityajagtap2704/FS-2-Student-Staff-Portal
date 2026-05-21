import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

<<<<<<< HEAD
    // Only HOD and NON_TEACHING_STAFF can view all students
    if (user.role !== "HOD" && user.role !== "NON_TEACHING_STAFF") {
=======
    // Only HOD can view all students
    if (user.role !== "HOD") {
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "500");

    // Fetch all active students
    const students = await db.student.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        classEnrolled: true,
        rollNumber: true,
        status: true,
      },
      orderBy: { name: "asc" },
      take: limit,
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Students GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
