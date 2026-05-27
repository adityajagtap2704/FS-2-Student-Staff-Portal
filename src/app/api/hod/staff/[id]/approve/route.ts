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
    const { assignedClass, resolveConflict } = body;
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

    // CONFLICT 1 FIX: Check if class is already assigned to another active teacher
    if (assignedClass) {
      const existingTeacher = await db.staff.findFirst({
        where: {
          assignedClass,
          id: { not: staffId },
          isActive: true,
        },
      });

      if (existingTeacher && !resolveConflict) {
        // Get available classes for alternative assignment
        const allClasses = await db.staff.findMany({
          where: { isActive: true, assignedClass: { not: null } },
          select: { assignedClass: true },
          distinct: ["assignedClass"],
        });
        const assignedClasses = new Set(allClasses.map(s => s.assignedClass));
        const availableClasses = [
          "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6",
          "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"
        ].filter(c => !assignedClasses.has(c));

        // Return CONFLICT 1 response
        return NextResponse.json(
          {
            success: false,
            code: "CLASS_CONFLICT_ON_APPROVAL",
            error: `Class ${assignedClass} is already assigned to ${existingTeacher.name} (${existingTeacher.email})`,
            conflictDetails: {
              requestedClass: assignedClass,
              existingTeacherId: existingTeacher.id,
              existingTeacherName: existingTeacher.name,
              existingTeacherEmail: existingTeacher.email,
              existingTeacherAssignedSince: existingTeacher.approvedAt,
            },
            resolutionOptions: {
              option1: {
                title: "Approve without class assignment",
                description: "Approve the teacher now without a class, then assign later using the reassignment feature",
                action: "approve_without_class",
              },
              option2: {
                title: "Swap classes",
                description: `Reassign ${existingTeacher.name} to another class and give ${assignedClass} to ${staff.name}`,
                availableClasses,
                action: "swap_classes",
                requiresSelection: true,
              },
              option3: {
                title: "Assign alternative class",
                description: "Assign a different available class to this new teacher",
                availableClasses,
                action: "assign_alternative_class",
                requiresSelection: true,
              },
            },
            nextSteps: `Please choose an option above or resubmit with resolveConflict: { action: "...", targetClass: "..." }`,
          },
          { status: 409 }
        );
      }

      // If resolveConflict is provided, handle the conflict resolution
      if (resolveConflict) {
        const { action, targetClass } = resolveConflict;

        if (action === "swap_classes") {
          // Swap: move existing teacher to targetClass, assign requested class to new teacher
          const existingTeacher2 = await db.staff.findFirst({
            where: {
              assignedClass,
              id: { not: staffId },
              isActive: true,
            },
          });

          if (!existingTeacher2) {
            return NextResponse.json(
              { error: "Original teacher no longer assigned to this class" },
              { status: 400 }
            );
          }

          // Update existing teacher
          await db.staff.update({
            where: { id: existingTeacher2.id },
            data: { assignedClass: targetClass },
          });

          // Update new teacher
          const updatedStaff = await db.staff.update({
            where: { id: staffId },
            data: {
              isActive: true,
              assignedClass: assignedClass,
              approvedBy: (session.user as any).email,
              approvedAt: new Date(),
            },
          });

          // Send emails
          try {
            const loginLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`;
            await sendStaffApprovalEmail(
              updatedStaff.name,
              updatedStaff.email,
              updatedStaff.role ?? "CLASS_TEACHER",
              updatedStaff.assignedClass,
              loginLink
            );
          } catch (emailError) {
            console.error("[STAFF APPROVAL] Error sending email:", emailError);
          }

          return NextResponse.json({
            success: true,
            message: `Staff approved and assigned to ${assignedClass}. ${existingTeacher2.name} was reassigned to ${targetClass}.`,
            staff: updatedStaff,
            swappedTeacher: {
              id: existingTeacher2.id,
              name: existingTeacher2.name,
              newClass: targetClass,
            },
          });
        } else if (action === "assign_alternative_class") {
          // Assign targetClass instead of the requested one
          const updatedStaff = await db.staff.update({
            where: { id: staffId },
            data: {
              isActive: true,
              assignedClass: targetClass,
              approvedBy: (session.user as any).email,
              approvedAt: new Date(),
            },
          });

          try {
            const loginLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`;
            await sendStaffApprovalEmail(
              updatedStaff.name,
              updatedStaff.email,
              updatedStaff.role ?? "CLASS_TEACHER",
              updatedStaff.assignedClass,
              loginLink
            );
          } catch (emailError) {
            console.error("[STAFF APPROVAL] Error sending email:", emailError);
          }

          return NextResponse.json({
            success: true,
            message: `Staff approved and assigned to ${targetClass} (${assignedClass} was unavailable).`,
            staff: updatedStaff,
          });
        }
      }
    }

    // Approve staff (activate account) - ALWAYS without class assignment on approval if no conflict
    const user = session.user as any;
    const updatedStaff = await db.staff.update({
      where: { id: staffId },
      data: {
        isActive: true,
        assignedClass: assignedClass || null, // Assign if provided and no conflict
        approvedBy: user.email,
        approvedAt: new Date(),
      },
    });

    // Send approval email to staff
    try {
      const loginLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`;
      await sendStaffApprovalEmail(
        updatedStaff.name,
        updatedStaff.email,
        updatedStaff.role ?? "CLASS_TEACHER",
        updatedStaff.assignedClass,
        loginLink
      );
      console.log("[STAFF APPROVAL] Email sent to:", updatedStaff.email);
    } catch (emailError) {
      console.error("[STAFF APPROVAL] Error sending email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: assignedClass
        ? `Staff approved and assigned to ${assignedClass}`
        : "Staff approved successfully. You can assign a class later using the reassignment feature.",
      staff: updatedStaff,
      conflict: null,
    });
  } catch (error) {
    console.error("Error approving staff:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
