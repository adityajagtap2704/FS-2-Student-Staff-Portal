import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { sendOTP } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, assignedClass } = body;

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Validation
    if (!name || !normalizedEmail || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        { error: "Password must contain uppercase, lowercase, and numbers" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["CLASS_TEACHER", "NON_TEACHING_STAFF"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be CLASS_TEACHER or NON_TEACHING_STAFF" },
        { status: 400 }
      );
    }

    // CLASS_TEACHER must have assignedClass
    if (role === "CLASS_TEACHER" && !assignedClass) {
      return NextResponse.json(
        { error: "Class Teachers must have an assigned class" },
        { status: 400 }
      );
    }

    // NON_TEACHING_STAFF should not have assignedClass
    if (role === "NON_TEACHING_STAFF" && assignedClass) {
      return NextResponse.json(
        { error: "Non-Teaching Staff should not have an assigned class" },
        { status: 400 }
      );
    }

    // Check if email already exists in Staff
    const existingStaff = await db.staff.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: "Email already registered as staff" },
        { status: 409 }
      );
    }

    // Check if email already exists in Student
    const existingStudent = await db.student.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: "Email already registered as student" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Delete any existing temporary signup for this email
    await db.staffSignupTemp.deleteMany({
      where: { email: normalizedEmail },
    });

    // Store temporary signup data (expires in 10 minutes, same as OTP)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await db.staffSignupTemp.create({
      data: {
        email: normalizedEmail,
        name,
        password: hashedPassword,
        role,
        assignedClass: role === "CLASS_TEACHER" ? assignedClass : null,
        expiresAt,
      },
    });

    console.log("Temporary staff signup data stored:", { email: normalizedEmail, role });

    // Send OTP for email verification
    const otpResult = await sendOTP(normalizedEmail);

    if (!otpResult.success) {
      console.log("Failed to send OTP for:", normalizedEmail);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email. Please verify to complete registration.",
    });
  } catch (error) {
    console.error("Staff sign-up error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
