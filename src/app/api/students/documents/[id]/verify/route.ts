import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Only HOD and NON_TEACHING_STAFF can verify documents
    if (user.role !== "HOD" && user.role !== "NON_TEACHING_STAFF") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const documentId = parseInt((await params).id);
    const { status, rejectionReason } = await req.json();

    if (!status || !["VERIFIED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be VERIFIED or REJECTED" },
        { status: 400 }
      );
    }

    // Find the document
    const document = await db.studentDocument.findUnique({
      where: { id: documentId },
      include: { student: true },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Update document status — cast verifiedBy to Int to match schema
    const updated = await db.studentDocument.update({
      where: { id: documentId },
      data: {
        status,
        verifiedByStaffId: parseInt(user.id),
        verifiedByStaffName: user.name || "Staff Member",
        verifiedAt: new Date(),
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
      },
      include: { student: true },
    });

    // Send notification to the student — use GENERAL type for broad compatibility
    const isVerified = status === "VERIFIED";
    try {
      await db.notification.create({
        data: {
          studentId: document.studentId,
          type: "GENERAL",
          title: isVerified
            ? `Document Verified: ${document.documentType}`
            : `Document Rejected: ${document.documentType}`,
          message: isVerified
            ? `Your ${document.documentType} has been verified successfully.`
            : `Your ${document.documentType} was rejected. Reason: ${rejectionReason || "No reason provided."}`,
          isRead: false,
        },
      });
    } catch (notifError) {
      // Notification failure must not block the verification response
      console.error("Notification creation failed (non-fatal):", notifError);
    }

    return NextResponse.json({
      success: true,
      document: updated,
      message: `Document ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("Document Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
