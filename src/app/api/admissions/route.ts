import { NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyOTP, isEmailVerified } from "@/lib/otp";
import { generateAdmissionReferenceNumber, generateEnquiryNumber } from "@/lib/enquiry";
import { validateAdmissionForm, sanitizeObject } from "@/lib/validation";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentName, parentName, email, phone, grade, startDate, otp, studentEmail } = body;

    console.log("[ADMISSION API] Received:", { studentName, parentName, email, phone, grade, startDate, otp });

    // Sanitize inputs
    const sanitized = sanitizeObject({
      studentName,
      parentName,
      email,
      phone,
      grade,
      startDate,
    });

    // Phase 3: Input validation using validation utility
    const validation = validateAdmissionForm({
      studentName: sanitized.studentName,
      parentName: sanitized.parentName,
      email: sanitized.email,
      phone: sanitized.phone,
      grade: sanitized.grade,
      startDate: sanitized.startDate,
    });

    if (!validation.valid) {
      console.log("[ADMISSION API] Validation failed:", validation.errors);
      return NextResponse.json({ errors: validation.errors }, { status: 422 });
    }

    // ── OTP Verification ──────────────────────────────────────────────────────
    if (!otp) {
      console.log("[ADMISSION API] OTP missing");
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    console.log("[ADMISSION API] Verifying OTP:", { email: sanitized.email.trim(), otp: otp.trim() });
    const otpVerification = await verifyOTP(sanitized.email.trim(), otp.trim());
    console.log("[ADMISSION API] OTP verification result:", otpVerification);
    
    if (!otpVerification.success) {
      console.log("[ADMISSION API] OTP verification failed:", otpVerification.message);
      return NextResponse.json(
        { error: otpVerification.message, code: "OTP_VERIFICATION_FAILED" },
        { status: 422 }
      );
    }

    // ── Duplicate check ───────────────────────────────────────────────────────
    // Phase 2: Enhanced duplicate check - block PENDING, APPROVED, and REJECTED (prevent re-submission)
    // Allow same phone (parent can have multiple children)
    // Only block if SAME STUDENT (same name + parent)
    
    // Block if same studentName + parentName already has an enquiry (same student)
    // This allows multiple children from same parent (different names)
    const sameStudentExists = await db.admission.findFirst({
      where: {
        studentName: { equals: sanitized.studentName.trim() },
        parentName:  { equals: sanitized.parentName.trim() },
        status:      { in: ["PENDING", "APPROVED", "REJECTED"] },
      },
    });
    if (sameStudentExists) {
      return NextResponse.json(
        { error: "An enquiry already exists for this student", code: "DUPLICATE_STUDENT" },
        { status: 409 }
      );
    }

    // ── Create Admission Record ────────────────────────────────────────────────
    const referenceNumber = await generateAdmissionReferenceNumber();

    const admission = await db.admission.create({
      data: {
        referenceNumber,
        studentName: sanitized.studentName.trim(),
        parentName:  sanitized.parentName.trim(),
        email:       sanitized.email.trim(),
        phone:       sanitized.phone.trim(),
        classApplied: sanitized.grade,
        status: "PENDING",
      },
    });

    console.log("[ADMISSION API] Admission created:", admission.id);

    // ── STAGE 1: Create PRE_APPLICANT Student Account for Public Enquiry ──────
    // This allows public enquirers to track their status without logging in
    let linkedStudent = null;
    
    // Check if student account already exists with this email
    let existingStudent = await db.student.findUnique({
      where: { email: sanitized.email.trim() },
    });

    if (!existingStudent) {
      // Create new PRE_APPLICANT account for public enquirer
      // They can use this to track their application status
      const enquiryNumber = await generateEnquiryNumber();
      
      existingStudent = await db.student.create({
        data: {
          email: sanitized.email.trim(),
          password: "", // Empty password - they'll set it later if they want to login
          name: sanitized.studentName.trim(),
          parentName: sanitized.parentName.trim(),
          phone: sanitized.phone.trim(),
          classEnrolled: sanitized.grade,
          status: "PRE_APPLICANT", // STAGE 1: Initial Entry
          isActive: true,
          admissionId: admission.id,
          enquiryNumber,
        },
      });

      console.log("[ADMISSION API] PRE_APPLICANT student created:", existingStudent.id);
    } else {
      // Link existing student to admission
      await db.student.update({
        where: { id: existingStudent.id },
        data: {
          admissionId: admission.id,
          status: "PRE_APPLICANT",
        },
      });
    }

    linkedStudent = existingStudent;

    // ── Send Confirmation Email with Tracking Info ────────────────────────────
    const confirmationEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">📋 Admission Enquiry Received</h2>
        <p>Dear ${sanitized.studentName},</p>
        <p>Thank you for submitting your admission enquiry to KALNET School. We have received your application and will review it shortly.</p>
        
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="color: #2563eb; margin-top: 0;">Your Application Reference</h3>
          <p><strong>Reference Number:</strong> <span style="font-size: 18px; color: #2563eb; font-weight: bold;">${admission.referenceNumber}</span></p>
          <p><strong>Class Applied For:</strong> ${sanitized.grade}</p>
          <p><strong>Submitted Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #d97706; margin-top: 0;">📧 Track Your Application</h3>
          <p>You can track your application status using your reference number:</p>
          <p><strong>${admission.referenceNumber}</strong></p>
          <p><a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admissions/status?ref=${admission.referenceNumber}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Check Application Status</a></p>
        </div>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">What's Next?</h3>
          <ol>
            <li>We will review your application within 2 business days</li>
            <li>You will receive an email notification with the decision</li>
            <li>If approved, you will receive login credentials to access the student portal</li>
            <li>If you have any questions, please contact our admissions office</li>
          </ol>
        </div>

        <p>Best regards,<br/><strong>KALNET School Management System</strong></p>
      </div>
    `;

    await sendEmail({
      to: sanitized.email.trim(),
      subject: `Admission Enquiry Received - Reference: ${admission.referenceNumber}`,
      html: confirmationEmailHtml,
    });

    console.log("[ADMISSION API] Confirmation email sent to:", sanitized.email.trim());

    return NextResponse.json({
      success: true,
      referenceNumber: admission.referenceNumber,
      message: "Enquiry submitted successfully. Check your email for tracking details.",
      studentId: linkedStudent?.id,
      email: linkedStudent?.email,
    });
  } catch (error) {
    console.error("Admission API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
<<<<<<< HEAD
    // Protect — only HOD and NON_TEACHING_STAFF can list all admissions
=======
    // Protect — only HOD can list all admissions
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
    const { getServerSession } = await import("next-auth");
    const { authOptions }      = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    const user    = session?.user as any;
<<<<<<< HEAD
    if (!session || (user?.role !== "HOD" && user?.role !== "NON_TEACHING_STAFF")) {
=======
    if (!session || user?.role !== "HOD") {
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admissions = await db.admission.findMany({
      orderBy: { submittedAt: "desc" },
    });
    return NextResponse.json(admissions);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
