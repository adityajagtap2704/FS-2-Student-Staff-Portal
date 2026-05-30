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

    // 1. Increment Download Count dynamically in database
    const updatedNote = await db.note.update({
      where: { id: noteId },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

    // 2. Generate secure download link valid for 10 minutes (600 seconds)
    const s3Key = extractS3KeyFromUrl(note.fileUrl);
    const signedUrl = await getSignedDownloadUrl(s3Key, 600);

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl,
      downloadCount: updatedNote.downloadCount,
    });
  } catch (error) {
    console.error("Note DOWNLOAD Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
