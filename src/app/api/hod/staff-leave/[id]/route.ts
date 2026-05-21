import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PATCH — HOD approves or rejects a staff leave request
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user    = session?.user as any;
    if (!session || user?.role !== "HOD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id   = parseInt(params.id);
    const body = await req.json();
    const { status, rejectionReason } = body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const leave = await db.leaveRequest.findUnique({
      where: { id },
      include: { staff: { select: { name: true } } },
    });

    if (!leave || !leave.staffId) {
      return NextResponse.json({ error: "Staff leave request not found" }, { status: 404 });
    }

    const updated = await db.leaveRequest.update({
      where: { id },
      data:  { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("HOD Staff Leave PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
