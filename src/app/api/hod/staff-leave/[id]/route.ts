import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkLeaveCoverage } from "@/lib/timetableCoverageHelper";

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
      include: { staff: { select: { name: true, id: true } } },
    });

    if (!leave || !leave.staffId) {
      return NextResponse.json({ error: "Staff leave request not found" }, { status: 404 });
    }

    const updated = await db.leaveRequest.update({
      where: { id },
      data:  { 
        status,
        approvedBy: status === "APPROVED" ? parseInt(user.id) : null,
        approvedAt: status === "APPROVED" ? new Date() : null,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
      },
    });

    // If approved, check coverage and return coverage information
    let coverageInfo = null;
    if (status === "APPROVED" && leave.staffId) {
      coverageInfo = await checkLeaveCoverage(
        leave.staffId,
        leave.fromDate,
        leave.toDate,
        "2025-26"
      );
    }

    return NextResponse.json({
      ...updated,
      coverageInfo,
      actionRequired:
        status === "APPROVED" && (coverageInfo?.uncoveredSlots?.length ?? 0) > 0 ? true : false,
      message: status === "APPROVED" 
        ? `Leave approved for ${leave.staff?.name}. Coverage status: ${coverageInfo?.coverageStatus}. ${coverageInfo?.uncoveredSlots?.length || 0} slots need substitute assignment.`
        : `Leave rejected for ${leave.staff?.name}`,
    });
  } catch (error) {
    console.error("HOD Staff Leave PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
