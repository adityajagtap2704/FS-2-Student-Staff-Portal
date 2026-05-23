import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { sendStaffRejectionEmail } from "@/lib/staffEmailNotifications";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Verify user is HOD
    if (!session?.user || (session.user as any).role !== "HOD") {
      return NextResponse.json(
        { error: "Unauthorized. Only HOD can reject staff." },
        { status: 403 }
      );
    }

    const staffId = parseInt(params.id);

    // Get the staff member
    const staff = await db.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Send rejection email before updating
    try {
      const body = await req.json();
      const { rejectionReason } = body;
      
      await sendStaffRejectionEmail(
        staff.name,
        staff.email,
        rejectionReason
      );
      console.log("[STAFF REJECTION] Email sent to:", staff.email);
    } catch (emailError) {
      console.error("[STAFF REJECTION] Error sending email:", emailError);
      // Don't fail the rejection if email fails
    }

    // Update staff with rejection reason instead of deleting
    const user = session.user as any;
    const rejectedStaff = await db.staff.update({
      where: { id: staffId },
      data: {
        isActive: false,
        rejectionReason: (await req.json()).rejectionReason || "Not specified",
        approvedBy: user.email,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Staff registration rejected",
      staff: rejectedStaff,
    });
  } catch (error) {
    console.error("Error rejecting staff:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
