import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { createNotificationNoDuplicates } from "@/lib/notificationHelper";

/**
 * PATCH /api/non-teaching-staff/installments/[id]
 * Non-teaching staff approves or rejects an installment request.
 * On approval  → creates Installment records, notifies student (in-app + email).
 * On rejection → notifies student (in-app + email).
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || user?.role !== "NON_TEACHING_STAFF") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const requestId = parseInt(params.id);
    if (isNaN(requestId)) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
    }

    const body = await req.json();
    const { status, rejectionReason } = body as {
      status: "APPROVED" | "REJECTED";
      rejectionReason?: string;
    };

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Fetch the installment request with student + fee
    const installmentRequest = await db.installmentRequest.findUnique({
      where: { id: requestId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            parentEmail: true,
            classEnrolled: true,
          },
        },
        fee: true,
      },
    });

    if (!installmentRequest) {
      return NextResponse.json({ error: "Installment request not found" }, { status: 404 });
    }

    if (installmentRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: `Request is already ${installmentRequest.status.toLowerCase()}` },
        { status: 422 }
      );
    }

    const feeAmount = Number(installmentRequest.fee.amount);
    const firstInstallment = Math.round(feeAmount / 2);
    const secondInstallment = feeAmount - firstInstallment;

    // ── Update the request status ──────────────────────────────────────────
    const updated = await db.installmentRequest.update({
      where: { id: requestId },
      data: {
        status,
        approvedBy: user.email,
        approvedAt: new Date(),
        ...(status === "REJECTED" && { rejectionReason: rejectionReason || null }),
      },
    });

    // ── On APPROVAL: create the two Installment records ───────────────────
    if (status === "APPROVED") {
      const now = new Date();
      const secondDueDate = new Date(now);
      secondDueDate.setDate(secondDueDate.getDate() + 30); // 30 days later

      // Delete any existing installments for this fee (safety)
      await db.installment.deleteMany({ where: { feeId: installmentRequest.feeId } });

      await db.installment.createMany({
        data: [
          {
            feeId: installmentRequest.feeId,
            studentId: installmentRequest.studentId,
            installmentNumber: 1,
            amount: firstInstallment,
            dueDate: now,
            status: "PENDING",
          },
          {
            feeId: installmentRequest.feeId,
            studentId: installmentRequest.studentId,
            installmentNumber: 2,
            amount: secondInstallment,
            dueDate: secondDueDate,
            status: "PENDING",
          },
        ],
      });
    }

    const student = installmentRequest.student;
    const fee = installmentRequest.fee;

    // ── In-app notification ────────────────────────────────────────────────
    const notifTitle =
      status === "APPROVED"
        ? "Installment Request Approved ✅"
        : "Installment Request Rejected ❌";

    const notifMessage =
      status === "APPROVED"
        ? `Your installment request for ${fee.term} (₹${feeAmount.toLocaleString("en-IN")}) has been approved. ` +
          `1st installment: ₹${firstInstallment.toLocaleString("en-IN")} (due now), ` +
          `2nd installment: ₹${secondInstallment.toLocaleString("en-IN")} (due in 30 days).`
        : `Your installment request for ${fee.term} has been rejected.` +
          (rejectionReason ? ` Reason: ${rejectionReason}` : " Please contact the fees office for more information.");

    await createNotificationNoDuplicates(
      student.id,
      "GENERAL",
      notifTitle,
      notifMessage,
      5 // 5-minute dedup window
    );

    // ── Email to student ───────────────────────────────────────────────────
    const emailTo = student.email;
    if (emailTo) {
      const emailHtml =
        status === "APPROVED"
          ? `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;font-size:24px;">✅ Installment Request Approved</h1>
  </div>
  <div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px;">
    <p style="color:#374151;font-size:16px;">Dear ${student.name},</p>
    <p style="color:#374151;font-size:14px;line-height:1.6;">
      Your installment request for <strong>${fee.term}</strong> has been <strong style="color:#10b981;">approved</strong> by the fees office.
    </p>
    <div style="background:white;border:1px solid #e5e7eb;border-radius:6px;padding:20px;margin:20px 0;">
      <h3 style="color:#1f2937;margin-top:0;">Payment Schedule:</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0;color:#6b7280;">Term:</td>
          <td style="padding:10px 0;color:#1f2937;text-align:right;font-weight:600;">${fee.term}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0;color:#6b7280;">Total Fee:</td>
          <td style="padding:10px 0;color:#1f2937;text-align:right;">₹${feeAmount.toLocaleString("en-IN")}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0;color:#6b7280;">1st Installment (Due Now):</td>
          <td style="padding:10px 0;color:#10b981;text-align:right;font-weight:700;">₹${firstInstallment.toLocaleString("en-IN")}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#6b7280;">2nd Installment (Due in 30 days):</td>
          <td style="padding:10px 0;color:#f59e0b;text-align:right;font-weight:700;">₹${secondInstallment.toLocaleString("en-IN")}</td>
        </tr>
      </table>
    </div>
    <div style="background:#d1fae5;border-left:4px solid #10b981;padding:15px;border-radius:4px;margin-bottom:20px;">
      <p style="color:#065f46;margin:0;font-size:14px;">
        Please login to your student portal to make the first installment payment.
      </p>
    </div>
    <p style="color:#6b7280;font-size:12px;margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;">
      This is an automated email from KALNET School Management System.
    </p>
  </div>
</div>`
          : `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;font-size:24px;">❌ Installment Request Rejected</h1>
  </div>
  <div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px;">
    <p style="color:#374151;font-size:16px;">Dear ${student.name},</p>
    <p style="color:#374151;font-size:14px;line-height:1.6;">
      Your installment request for <strong>${fee.term}</strong> has been <strong style="color:#ef4444;">rejected</strong>.
    </p>
    ${
      rejectionReason
        ? `<div style="background:#fee2e2;border-left:4px solid #ef4444;padding:15px;border-radius:4px;margin:20px 0;">
             <p style="color:#991b1b;margin:0;font-size:14px;"><strong>Reason:</strong> ${rejectionReason}</p>
           </div>`
        : ""
    }
    <p style="color:#374151;font-size:14px;line-height:1.6;">
      Please contact the fees office at <a href="mailto:fees@kalnet.edu" style="color:#10b981;">fees@kalnet.edu</a> for more information or to discuss alternative arrangements.
    </p>
    <p style="color:#6b7280;font-size:12px;margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;">
      This is an automated email from KALNET School Management System.
    </p>
  </div>
</div>`;

      try {
        await sendEmail({
          to: emailTo,
          subject:
            status === "APPROVED"
              ? `✅ Installment Request Approved – ${fee.term} | KALNET`
              : `❌ Installment Request Rejected – ${fee.term} | KALNET`,
          html: emailHtml,
        });
        console.log(`[INSTALLMENT] Email sent to ${emailTo} — status: ${status}`);
      } catch (emailErr) {
        console.error("[INSTALLMENT] Email failed:", emailErr);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Installment request ${status.toLowerCase()} successfully`,
      request: updated,
    });
  } catch (error) {
    console.error("[INSTALLMENT PATCH] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
