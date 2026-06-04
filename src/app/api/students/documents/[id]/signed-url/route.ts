import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSignedDownloadUrl, s3KeyExists } from "@/lib/aws-s3";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const documentId = parseInt((await params).id);

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

    // Check access: Students can only view their own, HOD/NON_TEACHING_STAFF can view any
    if (user.role === "STUDENT" && document.studentId !== parseInt(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("Document fileUrl:", document.fileUrl);

    // Check if fileUrl is in old base64 format
    if (document.fileUrl.startsWith("data:")) {
      console.log("Returning base64 document");
      return NextResponse.json({
        success: true,
        signedUrl: document.fileUrl,
        fileName: document.fileName,
        documentType: document.documentType,
        isBase64: true,
      });
    }

    // The fileUrl should be an S3 key or full URL
    let s3Key = document.fileUrl;

    // If it's a full URL, extract the key
    if (s3Key.startsWith("http")) {
      try {
        const url = new URL(s3Key);
        s3Key = decodeURIComponent(url.pathname.substring(1));
      } catch (e) {
        console.error("Failed to parse URL:", s3Key);
        return NextResponse.json(
          { error: "Invalid document URL format" },
          { status: 400 }
        );
      }
    }

    console.log("S3 Key:", s3Key);

    // Validate S3 key is not empty
    if (!s3Key || s3Key.length === 0) {
      console.error("Invalid S3 key:", document.fileUrl);
      return NextResponse.json(
        { error: "Document URL is invalid" },
        { status: 400 }
      );
    }

    // Verify the object actually exists in S3 before generating a signed URL.
    // This prevents the student from seeing a raw S3 "NoSuchKey" XML error page.
    const exists = await s3KeyExists(s3Key);
    if (!exists) {
      console.error("S3 object not found for key:", s3Key);
      return NextResponse.json(
        {
          error:
            "The document file could not be found in storage. It may have been uploaded with an earlier version of the system. Please re-upload this document.",
          code: "S3_KEY_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Generate signed URL (valid for 1 hour)
    console.log("Generating signed URL for key:", s3Key);
    const signedUrl = await getSignedDownloadUrl(s3Key, 3600);
    console.log("Generated signed URL successfully");

    return NextResponse.json({
      success: true,
      signedUrl,
      fileName: document.fileName,
      documentType: document.documentType,
      isBase64: false,
    });
  } catch (error) {
    console.error("Signed URL Generation Error:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to generate download link";
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
