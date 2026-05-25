import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET — HOD views all staff leave requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user    = session?.user as any;
    if (!session || user?.role !== "HOD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const requests = await db.leaveRequest.findMany({
      where:   { staffId: { not: null } },
      include: {
        staff: {
          select: { id: true, name: true, email: true, role: true, assignedClass: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("HOD Staff Leave GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
