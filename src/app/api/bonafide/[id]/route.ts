import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { createNotificationNoDuplicates } from "@/lib/notificationHelper";
import { notifications_type } from "@prisma/client";

// PATCH /api/bonafide/[id]
// NON_TEACHING_STAFF only — approve or reject a request
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const { status, rejectionReason } = body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const bonafide = await db.bonafideRequest.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, name: true, email: true, classEnrolled: true, rollNumber: true },
        },
      },
    });

    if (!bonafide) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (bonafide.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot update a request that is already ${bonafide.status.toLowerCase()}` },
        { status: 422 }
      );
    }

    const staffId = parseInt(user.id);

    const updated = await db.bonafideRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: staffId,
        ...(status === "APPROVED" && { approvedAt: new Date() }),
        ...(status === "REJECTED" && { rejectionReason: rejectionReason?.trim() || null }),
      },
    });

    const student = bonafide.student;

    // Send in-app notification + email (non-blocking — don't fail the request if these fail)
    if (student) {
      const notifType: notifications_type =
        status === "APPROVED"
          ? notifications_type.BONAFIDE_APPROVED
          : notifications_type.BONAFIDE_REJECTED;

      const notifTitle =
        status === "APPROVED"
          ? "Bonafide Certificate Approved"
          : "Bonafide Certificate Request Rejected";

      const notifMessage =
        status === "APPROVED"
          ? "Your bonafide certificate request has been approved. You can now download your certificate from the portal."
          : `Your bonafide certificate request has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`;

      try {
        await createNotificationNoDuplicates(student.id, notifType, notifTitle, notifMessage, 5);
      } catch (notifErr) {
        console.error("[BONAFIDE PATCH] Notification error (non-fatal):", notifErr);
      }

      // Email
      const emailHtml =
        status === "APPROVED"
          ? `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <h2 style="color:#1D9E75;">✅ Bonafide Certificate Approved</h2>
              <p>Dear ${student.name},</p>
              <p>Your bonafide certificate request has been <strong>approved</strong>.</p>
              <div style="background:#edfaf4;padding:15px;border-radius:8px;border-left:4px solid #1D9E75;margin:20px 0;">
                <p><strong>Purpose:</strong> ${bonafide.reason}</p>
                <p><strong>Approved on:</strong> ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <p>You can now download your certificate by logging into the student portal.</p>
              <p>Best regards,<br/><strong>KALNET School Management System</strong></p>
            </div>`
          : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <h2 style="color:#dc2626;">❌ Bonafide Certificate Request Rejected</h2>
              <p>Dear ${student.name},</p>
              <p>Your bonafide certificate request has been <strong>rejected</strong>.</p>
              <div style="background:#fef2f2;padding:15px;border-radius:8px;border-left:4px solid #dc2626;margin:20px 0;">
                <p><strong>Purpose:</strong> ${bonafide.reason}</p>
                ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
              </div>
              <p>Please contact the school office if you have any questions.</p>
              <p>Best regards,<br/><strong>KALNET School Management System</strong></p>
            </div>`;

      if (student.email) {
        try {
          await sendEmail({
            to: student.email,
            subject: status === "APPROVED"
              ? "Bonafide Certificate Approved – KALNET"
              : "Bonafide Certificate Request Update – KALNET",
            html: emailHtml,
          });
        } catch (emailErr) {
          console.error("[BONAFIDE PATCH] Email error (non-fatal):", emailErr);
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[BONAFIDE PATCH]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/bonafide/[id]
// STUDENT only — cancel their own PENDING request
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const studentId = parseInt(user.id);

    const bonafide = await db.bonafideRequest.findUnique({ where: { id } });

    if (!bonafide) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (bonafide.studentId !== studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (bonafide.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending requests can be cancelled" },
        { status: 422 }
      );
    }

    await db.bonafideRequest.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BONAFIDE DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
