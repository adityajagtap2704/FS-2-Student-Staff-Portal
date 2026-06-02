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

    // If approved, check coverage — wrapped so it never causes a 500
    let coverageInfo = null;
    if (status === "APPROVED" && leave.staffId) {
      try {
        coverageInfo = await checkLeaveCoverage(
          leave.staffId,
          leave.fromDate,
          leave.toDate,
          "2025-26"
        );
      } catch (coverageError) {
        console.error("HOD Staff Leave PATCH - coverage check failed (non-fatal):", coverageError);
        // Coverage check is informational; don't fail the approval
      }
    }

    // Send notification to the staff member about their leave decision
    if (leave.staffId) {
      try {
        const fromStr = new Date(leave.fromDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        const toStr   = new Date(leave.toDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        await db.notification.create({
          data: {
            staffId: leave.staffId,
            type: status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
            title: status === "APPROVED" ? "Leave Approved" : "Leave Rejected",
            message: status === "APPROVED"
              ? `Your leave request from ${fromStr} to ${toStr} has been approved by HOD.`
              : `Your leave request from ${fromStr} to ${toStr} has been rejected.${rejectionReason ? " Reason: " + rejectionReason : ""}`,
          },
        });
        // Also notify HOD to assign substitute if approved and there are uncovered slots
        if (status === "APPROVED" && (coverageInfo?.uncoveredSlots?.length ?? 0) > 0) {
          const hodId = parseInt(user.id);
          await db.notification.create({
            data: {
              staffId: hodId,
              type: "GENERAL",
              title: "Substitute Assignment Needed",
              message: `${leave.staff?.name} is on leave from ${fromStr} to ${toStr}. Please assign a substitute in Class Assignments.`,
            },
          });
        }
      } catch (notifError) {
        console.error("HOD Staff Leave PATCH - notification failed (non-fatal):", notifError);
      }
    }

    return NextResponse.json({
      ...updated,
      coverageInfo,
      actionRequired:
        status === "APPROVED" && (coverageInfo?.uncoveredSlots?.length ?? 0) > 0 ? true : false,
      message: status === "APPROVED" 
        ? `Leave approved for ${leave.staff?.name}. Coverage status: ${coverageInfo?.coverageStatus ?? "unknown"}. ${coverageInfo?.uncoveredSlots?.length || 0} slots need substitute assignment.`
        : `Leave rejected for ${leave.staff?.name}`,
    });
  } catch (error) {
    console.error("HOD Staff Leave PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
