import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { studentName, parentName, phone, classApplied, startDate, email } = body;

    if (!studentName || !parentName || !phone || !classApplied || !startDate) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Find student
    const student = await db.student.findUnique({
      where: { email: session.user.email },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Generate unique enquiry number: ENQ-YYYY-XXX
    const year = new Date().getFullYear();
    const count = await db.student.count({
      where: { enquiryNumber: { not: null } },
    });
    const enquiryNumber = `ENQ-${year}-${String(count + 1).padStart(3, "0")}`;

    // Update student with enquiry information
    const updatedStudent = await db.student.update({
      where: { id: student.id },
      data: {
        name: studentName,
        parentName,
        phone,
        classEnrolled: classApplied,
        enquiryNumber,
        status: "APPLICANT",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Enquiry submitted successfully",
      enquiryNumber,
      student: {
        id: updatedStudent.id,
        email: updatedStudent.email,
        status: updatedStudent.status,
        enquiryNumber: updatedStudent.enquiryNumber,
      },
    });
  } catch (error) {
    console.error("Enquiry submission error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
