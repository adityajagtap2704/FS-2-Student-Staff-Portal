import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSignedDownloadUrl, extractS3KeyFromUrl } from "@/lib/aws-s3";

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
    if (user.role !== "CLASS_TEACHER" && user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const noteId = parseInt((await params).id);
    const note = await db.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const s3Key = extractS3KeyFromUrl(note.fileUrl);
    // Generate S3 Signed URL valid for 1 hour (3600 seconds)
    const signedUrl = await getSignedDownloadUrl(s3Key, 3600);

    const fileExtension = note.fileName.split(".").pop()?.toLowerCase() || "";

    // Generate a Google Doc Viewer embedded preview link for Office files
    const isOfficeDoc = ["doc", "docx", "ppt", "pptx"].includes(fileExtension);
    const googleViewerUrl = isOfficeDoc
      ? `https://docs.google.com/gview?url=${encodeURIComponent(signedUrl)}&embedded=true`
      : null;

    return NextResponse.json({
      previewUrl: signedUrl,
      googleViewerUrl,
      fileName: note.fileName,
      fileType: fileExtension,
    });
  } catch (error) {
    console.error("Note PREVIEW Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
