import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

<<<<<<< HEAD
// GET — staff member fetches their own leave requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;

    if (!["CLASS_TEACHER", "HOD", "NON_TEACHING_STAFF"].includes(user?.role)) {
=======
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user    = session?.user as any;
    if (!session || (user?.role !== "CLASS_TEACHER" && user?.role !== "HOD")) {
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const staffId = parseInt(user.id);

<<<<<<< HEAD
    const leaveRequests = await db.leaveRequest.findMany({
      where: { staffId },
=======
    // Get the staff member's own leave requests
    const leaveRequests = await db.leaveRequest.findMany({
      where:   { staffId },
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(leaveRequests);
  } catch (error) {
<<<<<<< HEAD
    console.error("Staff Leave GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE — staff cancels their own PENDING leave request
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;

    if (!["CLASS_TEACHER", "HOD", "NON_TEACHING_STAFF"].includes(user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const staffId = parseInt(user.id);
    const { id } = await req.json();

    if (!id) return NextResponse.json({ error: "Missing leave request id" }, { status: 400 });

    const leave = await db.leaveRequest.findUnique({ where: { id: parseInt(id) } });

    if (!leave) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (leave.staffId !== staffId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (leave.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only PENDING requests can be cancelled" },
        { status: 422 }
      );
    }

    await db.leaveRequest.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Staff Leave DELETE Error:", error);
=======
    console.error("Staff Leave Error:", error);
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
