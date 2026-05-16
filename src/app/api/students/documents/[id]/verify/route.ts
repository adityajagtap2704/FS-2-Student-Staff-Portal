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
    
    // Only HOD can verify documents
    if (user.role !== "HOD") {
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

    // Update document status
    const updated = await db.studentDocument.update({
      where: { id: documentId },
      data: {
        status,
        verifiedBy: user.id,
        verifiedAt: new Date(),
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
      },
      include: { student: true },
    });

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
