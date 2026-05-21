import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail, getAdmissionApprovalTemplate, getAdmissionRejectionTemplate } from "@/lib/email";
import { notifyAdmissionApproved, notifyAdmissionRejected } from "@/lib/notifications";
import { createNotificationNoDuplicates } from "@/lib/notificationHelper";
import { hashPassword } from "@/lib/password";
import { generateRandomPassword } from "@/lib/password";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user    = session?.user as any;
<<<<<<< HEAD
    if (!session || (user?.role !== "HOD" && user?.role !== "NON_TEACHING_STAFF")) {
=======
    if (!session || user?.role !== "HOD") {
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id   = parseInt(params.id);
    const body = await req.json();
    const { status, rejectionReason } = body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const admission = await db.admission.findUnique({ where: { id } });
    if (!admission) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Phase 2: Status transition validation - only PENDING can be approved/rejected
    if (admission.status !== "PENDING") {
      return NextResponse.json({ 
        error: `Cannot ${status.toLowerCase()} an admission that is already ${admission.status.toLowerCase()}`,
        code: "INVALID_STATUS_TRANSITION"
      }, { status: 422 });
    }

    const updated = await db.admission.update({
      where: { id },
      data:  { 
        status,
        ...(status === "APPROVED" && {
          approvedAt: new Date(),
          approvedBy: user.email,
        }),
        ...(status === "REJECTED" && {
          rejectionReason: rejectionReason || null,
        }),
      },
    });

    // Set admissionDate when student is approved
    if (status === "APPROVED") {
      await db.student.updateMany({
        where: { admissionId: id },
        data: { 
          admissionDate: new Date(),
          status: "STUDENT",
        },
      });
    }

    let createdStudent: any = null;
    let studentCredentials: any = null;

    if (status === "APPROVED") {
      // Check if student already exists with this email
      let student = await db.student.findUnique({
        where: { email: admission.email },
      });

      if (student) {
        // STAGE 2 → STAGE 3: Upgrade PRE_APPLICANT to STUDENT
        // Student already has account from enquiry, now give them full access
        const tempPassword = generateRandomPassword(12);
        const hashedPassword = await hashPassword(tempPassword);

        await db.student.update({
          where: { id: student.id },
          data: {
            status: "STUDENT", // STAGE 3: Full access to student portal
            password: hashedPassword, // Set temporary password
            admission: {
              connect: { id: admission.id },
            },
          },
        });

        createdStudent = student;
        studentCredentials = {
          email: admission.email,
          tempPassword: tempPassword,
        };
        console.log("[ADMISSION APPROVAL] Student upgraded to STUDENT:", student.id);
      } else {
        // Fallback: Create new student account (shouldn't happen in normal flow)
        const tempPassword = generateRandomPassword(12);
        const hashedPassword = await hashPassword(tempPassword);

        student = await db.student.create({
          data: {
            email: admission.email,
            password: hashedPassword,
            name: admission.studentName,
            parentName: admission.parentName,
            phone: admission.phone,
            classEnrolled: admission.classApplied,
            status: "STUDENT",
            isActive: true,
            admission: {
              connect: { id: admission.id },
            },
          },
        });

        createdStudent = student;
        studentCredentials = {
          email: admission.email,
          tempPassword: tempPassword,
        };

        console.log("[ADMISSION APPROVAL] New student account created:", student.id);
      }

      // Send approval email with portal access info
      const approvalEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🎉 Admission Approved!</h2>
          <p>Dear ${admission.studentName},</p>
          <p>Congratulations! Your admission application has been approved. You are now officially admitted to KALNET School.</p>
          
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #2563eb; margin-top: 0;">Admission Details</h3>
            <p><strong>Reference Number:</strong> ${admission.referenceNumber}</p>
            <p><strong>Class:</strong> ${admission.classApplied}</p>
            <p><strong>Approved Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #d97706; margin-top: 0;">📱 Access Your Student Portal</h3>
            <p>Your student account is now active. You can login to access:</p>
            <ul>
              <li>View your admission status and documents</li>
              <li>Pay application and tuition fees</li>
              <li>Submit leave requests</li>
              <li>View announcements and notices</li>
              <li>Access course materials and grades (once classes begin)</li>
            </ul>
            
            ${studentCredentials ? `
            <div style="background-color: #fff; padding: 10px; border-radius: 3px; margin: 10px 0;">
              <p><strong>Email:</strong> ${admission.email}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 2px 5px;">${studentCredentials.tempPassword}</code></p>
              <p style="color: #dc2626; font-size: 12px;">⚠️ Please change your password after first login</p>
            </div>
            ` : `
            <p>Use your email and password to login to the portal.</p>
            `}
            
            <p><a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Login to Portal</a></p>
          </div>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Next Steps</h3>
            <ol>
              <li>Login to your student portal</li>
              <li>Complete your profile information</li>
              <li>Upload required documents</li>
              <li>Pay the application fee</li>
              <li>Wait for class assignment confirmation</li>
            </ol>
          </div>

          <p>If you have any questions, please contact our admissions office.</p>
          <p>Best regards,<br/><strong>KALNET School Management System</strong></p>
        </div>
      `;

      console.log("[ADMISSION APPROVAL] Sending approval email to:", admission.email);
      try {
        const emailSent = await sendEmail({
          to: admission.email,
          subject: `Admission Approved - Welcome to KALNET School! (Ref: ${admission.referenceNumber})`,
          html: approvalEmailHtml,
        });

        if (!emailSent) {
          console.error("[ADMISSION APPROVAL] Email FAILED to send to:", admission.email);
          // Don't fail the approval if email fails - still return success
        } else {
          console.log("[ADMISSION APPROVAL] Email sent successfully to:", admission.email);
        }
      } catch (emailError) {
        console.error("[ADMISSION APPROVAL] Email error:", emailError);
        // Don't fail the approval if email fails
      }

      // Create notification for student
      if (createdStudent) {
        await createNotificationNoDuplicates(
          createdStudent.id,
          "ADMISSION_APPROVED",
          "Admission Approved",
          `Congratulations! Your admission application (${admission.referenceNumber}) has been approved. You can now access the student portal.`,
          60
        );
      }
    } else if (status === "REJECTED") {
      // Send rejection email
      const rejectionEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Admission Status Update</h2>
          <p>Dear ${admission.studentName},</p>
          <p>Thank you for your interest in KALNET School. We regret to inform you that your admission application has not been approved at this time.</p>
          
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p><strong>Reference Number:</strong> ${admission.referenceNumber}</p>
            <p><strong>Application Status:</strong> Not Approved</p>
            ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
          </div>

          <p>Please feel free to contact the school office if you have any questions or would like to discuss this decision.</p>
          <p>Best regards,<br/><strong>KALNET School Management System</strong></p>
        </div>
      `;

      await sendEmail({
        to: admission.email,
        subject: `Admission Status Update - Reference: ${admission.referenceNumber}`,
        html: rejectionEmailHtml,
      });

      console.log("[ADMISSION REJECTION] Rejection email sent to:", admission.email);

      // Update student status to REJECTED if account exists
      const student = await db.student.findUnique({
        where: { email: admission.email },
      });

      if (student) {
        await db.student.update({
          where: { id: student.id },
          data: { status: "REJECTED" },
        });

        // Create notification for student
        await createNotificationNoDuplicates(
          student.id,
          "ADMISSION_REJECTED",
          "Admission Status Update",
          `Your admission application (${admission.referenceNumber}) has been reviewed. ${rejectionReason ? `Reason: ${rejectionReason}` : "Please contact the school for more information."}`,
          60
        );
      }
    }

    return NextResponse.json({
      admission: updated,
      ...(createdStudent ? {
        studentCreated: true,
        studentId: createdStudent.id,
        email: createdStudent.email,
        ...(studentCredentials && { credentials: studentCredentials }),
      } : {}),
    });
  } catch (error) {
    console.error("Admission PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
