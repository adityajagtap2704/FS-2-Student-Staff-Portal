import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteFromS3, uploadToS3, extractS3KeyFromUrl } from "@/lib/aws-s3";

// Helper to check permission
async function checkNotePermission(noteId: number, userId: string, role: string) {
  const note = await db.note.findUnique({
    where: { id: noteId },
  });

  if (!note) {
    return { error: "Note not found", status: 404, note: null };
  }

  // Only teachers (CLASS_TEACHER) can manage (update/delete) notes, and only their own uploads
  if (role !== "CLASS_TEACHER" || note.staffId !== parseInt(userId)) {
    return { error: "Forbidden. You are not authorized to manage this note.", status: 403, note: null };
  }

  return { error: null, status: 200, note };
}

// ── PUT: Update Note ─────────────────────────────────────────────────────────
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const noteId = parseInt((await params).id);

    const { error, status, note } = await checkNotePermission(noteId, user.id, user.role);
    if (error || !note) {
      return NextResponse.json({ error }, { status });
    }

    const contentType = req.headers.get("content-type") || "";
    let dataToUpdate: any = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const title = formData.get("title") as string;
      const subject = formData.get("subject") as string;
      const section = formData.get("section") as string;
      const semester = formData.get("semester") as string;
      const description = formData.get("description") as string;
      const file = formData.get("file") as File;

      if (title) dataToUpdate.title = title.trim();
      if (subject) dataToUpdate.subject = subject.trim();
      if (section) dataToUpdate.section = section;
      if (semester) dataToUpdate.semester = semester;
      if (description !== undefined) dataToUpdate.description = description.trim() || null;

      // Handle new file replacement if present
      if (file && file.size > 0) {
        // Validate new file
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: "File size exceeds the 10MB limit." }, { status: 400 });
        }

        const allowedExtensions = ["pdf", "ppt", "pptx", "doc", "docx", "png", "jpg", "jpeg", "webp"];
        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
          return NextResponse.json({ error: "Invalid file type." }, { status: 400 });
        }

        // Delete previous S3 file
        try {
          const oldS3Key = extractS3KeyFromUrl(note.fileUrl);
          await deleteFromS3(oldS3Key);
        } catch (s3DelError) {
          console.error("Failed to delete previous note file from S3:", s3DelError);
        }

        // Upload new file to S3
        const folder = `notes/${(semester || note.semester || "All").replace(/\s+/g, "_")}`;
        const s3Key = await uploadToS3(
          file,
          folder,
          `note_${Date.now()}.${fileExtension}`
        );

        dataToUpdate.fileName = file.name;
        dataToUpdate.fileUrl = s3Key;
      }
    } else {
      // Standard JSON update
      const body = await req.json();
      const { title, subject, section, semester, description } = body;

      if (title) dataToUpdate.title = title.trim();
      if (subject) dataToUpdate.subject = subject.trim();
      if (section) dataToUpdate.section = section;
      if (semester) dataToUpdate.semester = semester;
      if (description !== undefined) dataToUpdate.description = description.trim() || null;
    }

    const updatedNote = await db.note.update({
      where: { id: noteId },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      message: "Note updated successfully!",
      note: updatedNote,
    });
  } catch (error) {
    console.error("Note PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── DELETE: Delete Note ──────────────────────────────────────────────────────
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const noteId = parseInt((await params).id);

    const { error, status, note } = await checkNotePermission(noteId, user.id, user.role);
    if (error || !note) {
      return NextResponse.json({ error }, { status });
    }

    // 1. Delete file from AWS S3
    try {
      const s3Key = extractS3KeyFromUrl(note.fileUrl);
      await deleteFromS3(s3Key);
    } catch (s3Error) {
      console.error("Failed to delete note from AWS S3 storage:", s3Error);
      // Continue deleting from DB even if S3 delete fails
    }

    // 2. Delete database entry
    await db.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully!",
    });
  } catch (error) {
    console.error("Note DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
