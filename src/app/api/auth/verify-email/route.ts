import { NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyOTP } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP required" },
        { status: 400 }
      );
    }

    // Trim and normalize inputs
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();

    console.log("OTP Verification attempt:", { email: trimmedEmail, otp: trimmedOtp });

    // Verify OTP
    const otpVerification = await verifyOTP(trimmedEmail, trimmedOtp);
    if (!otpVerification.success) {
      console.log("OTP verification failed:", otpVerification.message);
      return NextResponse.json(
        { error: otpVerification.message },
        { status: 422 }
      );
    }

    // Check if there's temporary staff signup data for this email
    const tempSignup = await db.staffSignupTemp.findUnique({
      where: { email: trimmedEmail },
    });

    if (tempSignup) {
      // Check if temporary data has expired
      if (new Date() > tempSignup.expiresAt) {
        console.log("Temporary signup data expired for:", trimmedEmail);
        return NextResponse.json(
          { error: "Signup data expired. Please sign up again." },
          { status: 400 }
        );
      }

      // Create staff account from temporary data
      const staff = await db.staff.create({
        data: {
          name: tempSignup.name,
          email: trimmedEmail,
          password: tempSignup.password,
          role: tempSignup.role,
          assignedClass: tempSignup.assignedClass,
          isActive: false, // Pending HOD approval
        },
      });

      // Delete temporary signup data
      await db.staffSignupTemp.delete({
        where: { email: trimmedEmail },
      });

      console.log("Staff account created from verified signup:", { id: staff.id, email: trimmedEmail });

      return NextResponse.json({
        success: true,
        message: "Email verified successfully. Your staff account is pending HOD approval.",
        staff: {
          id: staff.id,
          email: staff.email,
          name: staff.name,
          role: staff.role,
          isActive: staff.isActive,
        },
      });
    }

    // If no temporary signup found, try to find student (for backward compatibility)
    const student = await db.student.findUnique({
      where: { email: trimmedEmail },
    });

    if (student) {
      if (student.status !== "PRE_APPLICANT") {
        return NextResponse.json(
          { error: "Invalid student status for verification" },
          { status: 400 }
        );
      }

      // Update student status to APPLICANT
      const updatedStudent = await db.student.update({
        where: { email: trimmedEmail },
        data: { status: "APPLICANT" },
      });

      console.log("Student account verified:", trimmedEmail);

      return NextResponse.json({
        success: true,
        message: "Email verified successfully",
        student: {
          id: student.id,
          email: student.email,
          status: updatedStudent.status,
        },
      });
    }

    console.log("Account not found for email:", trimmedEmail);
    return NextResponse.json(
      { error: "Account not found. Please sign up first." },
      { status: 404 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
