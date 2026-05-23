import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { sendStaffApprovalEmail } from "@/lib/staffEmailNotifications";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Verify user is HOD
    if (!session?.user || (session.user as any).role !== "HOD") {
      return NextResponse.json(
        { error: "Unauthorized. Only HOD can approve staff." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { assignedClass } = body;
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

    // Check if class is already assigned to another active teacher
    if (assignedClass) {
      const existingTeacher = await db.staff.findFirst({
        where: {
          assignedClass,
          id: { not: staffId },
          isActive: true,
        },
      });

      if (existingTeacher) {
        // Return conflict - suggest approving without class first
        return NextResponse.json(
          {
            success: false,
            code: "CLASS_ALREADY_ASSIGNED",
            error: `Class ${assignedClass} is already assigned to ${existingTeacher.name}`,
            existingTeacherId: existingTeacher.id,
            existingTeacherName: existingTeacher.name,
            existingTeacherClass: existingTeacher.assignedClass,
            suggestion: "Approve this staff without assigning a class now, then use the reassignment feature to swap or reassign later.",
          },
          { status: 409 }
        );
      }
    }

    // Approve staff (activate account) - ALWAYS without class assignment on approval
    // Class assignment should be done separately using the reassignment feature
    const user = session.user as any;
    const updatedStaff = await db.staff.update({
      where: { id: staffId },
      data: {
        isActive: true,
        assignedClass: null, // Always approve without class assignment
        approvedBy: user.email, // Store HOD email
        approvedAt: new Date(),
      },
    });

    // Send approval email to staff
    try {
      const loginLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`;
      await sendStaffApprovalEmail(
        updatedStaff.name,
        updatedStaff.email,
        updatedStaff.role,
        updatedStaff.assignedClass,
        loginLink
      );
      console.log("[STAFF APPROVAL] Email sent to:", updatedStaff.email);
    } catch (emailError) {
      console.error("[STAFF APPROVAL] Error sending email:", emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Staff approved successfully. You can assign a class later using the reassignment feature.",
      staff: updatedStaff,
    });
  } catch (error) {
    console.error("Error approving staff:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
