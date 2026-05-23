import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Verify user is HOD
    if (!session?.user || (session.user as any).role !== "HOD") {
      return NextResponse.json(
        { error: "Unauthorized. Only HOD can reassign classes." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { newClass, swapWithStaffId } = body;
    const staffId = parseInt(params.id);

    // Get the staff member being reassigned
    const staff = await db.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // If no new class, just remove assignment
    if (!newClass) {
      const updatedStaff = await db.staff.update({
        where: { id: staffId },
        data: { assignedClass: null },
      });

      return NextResponse.json({
        success: true,
        message: `${staff.name} has been unassigned from their class`,
        staff: updatedStaff,
      });
    }

    // Check if new class is already assigned to another active teacher
    const existingTeacher = await db.staff.findFirst({
      where: {
        assignedClass: newClass,
        id: { not: staffId },
        isActive: true,
      },
    });

    // If class is assigned and no swap requested, return error with swap option
    if (existingTeacher && !swapWithStaffId) {
      return NextResponse.json(
        {
          error: `Class ${newClass} is already assigned to ${existingTeacher.name}`,
          code: "CLASS_CONFLICT",
          existingTeacherId: existingTeacher.id,
          existingTeacherName: existingTeacher.name,
          existingTeacherClass: existingTeacher.assignedClass,
          currentTeacherName: staff.name,
          currentTeacherClass: staff.assignedClass,
          suggestion: `Would you like to swap? ${staff.name} would take ${newClass} and ${existingTeacher.name} would take ${staff.assignedClass || "no class"}`,
        },
        { status: 409 }
      );
    }

    // If swap is requested, verify the swap teacher
    if (swapWithStaffId) {
      const swapTeacher = await db.staff.findUnique({
        where: { id: swapWithStaffId },
      });

      if (!swapTeacher) {
        return NextResponse.json(
          { error: "Swap teacher not found" },
          { status: 404 }
        );
      }

      if (swapTeacher.assignedClass !== newClass) {
        return NextResponse.json(
          { error: `${swapTeacher.name} is not assigned to ${newClass}` },
          { status: 400 }
        );
      }

      // Perform the swap
      await db.staff.update({
        where: { id: staffId },
        data: { assignedClass: newClass },
      });

      const updatedSwapTeacher = await db.staff.update({
        where: { id: swapWithStaffId },
        data: { assignedClass: staff.assignedClass || null },
      });

      const updatedStaff = await db.staff.findUnique({
        where: { id: staffId },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully swapped classes: ${staff.name} ↔ ${swapTeacher.name}`,
        staff: updatedStaff,
        swappedTeacher: updatedSwapTeacher,
      });
    }

    // Normal reassignment (no conflict)
    const updatedStaff = await db.staff.update({
      where: { id: staffId },
      data: { assignedClass: newClass },
    });

    return NextResponse.json({
      success: true,
      message: `${staff.name} reassigned to ${newClass}`,
      staff: updatedStaff,
    });
  } catch (error) {
    console.error("Error reassigning class:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
