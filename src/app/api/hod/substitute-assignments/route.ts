import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Verify user is HOD
    if (!session?.user || (session.user as any).role !== "HOD") {
      return NextResponse.json(
        { error: "Unauthorized. Only HOD can access this." },
        { status: 403 }
      );
    }

    const { absentStaffId, substituteStaffId, classEnrolled } = await req.json();

    if (!absentStaffId || !substituteStaffId || !classEnrolled) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (absentStaffId === substituteStaffId) {
      return NextResponse.json(
        { error: "Cannot assign the same staff as substitute" },
        { status: 400 }
      );
    }

    // Verify substitute is not also on leave
    const pendingLeaveCount = await db.leaveRequest.count({
      where: {
        staffId: substituteStaffId,
        status: "PENDING",
      },
    });

    const today = new Date();
    const activeLeave = await db.leaveRequest.findFirst({
      where: {
        staffId: substituteStaffId,
        status: "APPROVED",
        fromDate: { lte: today },
        toDate: { gte: today },
      },
    });

    if (pendingLeaveCount > 0 || activeLeave) {
      return NextResponse.json(
        { error: "Selected substitute is currently on leave or has pending leave" },
        { status: 400 }
      );
    }

    // Save assignment
    const existing = await db.substituteAssignment.findFirst({
      where: { absentStaffId, classEnrolled },
    });

    const assignment = existing
      ? await db.substituteAssignment.update({
          where: { id: existing.id },
          data: { substituteStaffId },
        })
      : await db.substituteAssignment.create({
          data: {
            absentStaffId,
            substituteStaffId,
            classEnrolled,
          },
        });

    return NextResponse.json({ message: "Substitute assigned successfully", assignment });
  } catch (error) {
    console.error("Error assigning substitute:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "HOD") {
      return NextResponse.json(
        { error: "Unauthorized. Only HOD can access this." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const absentStaffId = searchParams.get('absentStaffId');

    if (!absentStaffId) {
      return NextResponse.json(
        { error: "Missing absentStaffId parameter" },
        { status: 400 }
      );
    }

    // Delete all substitute assignments for this staff member
    await db.substituteAssignment.deleteMany({
      where: {
        absentStaffId: parseInt(absentStaffId)
      }
    });

    return NextResponse.json({ message: "Substitute removed successfully" });
  } catch (error) {
    console.error("Error removing substitute:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
