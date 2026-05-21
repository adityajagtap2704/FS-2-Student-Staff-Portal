import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Only HOD can update student status
    if (user.role !== "HOD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const studentId = parseInt((await params).id);
    const body = await req.json();
    const { status } = body;

    const validStatuses = ["PRE_APPLICANT", "APPLICANT", "STUDENT", "REJECTED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const student = await db.student.update({
      where: { id: studentId },
      data: {
        status,
        ...(status === "STUDENT" && { admissionDate: new Date() }),
      },
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error("Student Status Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
