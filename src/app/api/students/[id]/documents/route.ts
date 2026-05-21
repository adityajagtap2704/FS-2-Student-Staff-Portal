import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToS3, extractS3KeyFromUrl, deleteFromS3 } from "@/lib/aws-s3";

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
    const studentId = parseInt((await params).id);

    // Students can only view their own documents
<<<<<<< HEAD
    // HOD and NON_TEACHING_STAFF can view any student's documents
    if (user.role === "STUDENT" && parseInt(user.id) !== studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.role !== "STUDENT" && user.role !== "HOD" && user.role !== "NON_TEACHING_STAFF") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
=======
    // HOD can view any student's documents
    if (user.role === "STUDENT" && parseInt(user.id) !== studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d

    const documents = await db.studentDocument.findMany({
      where: { studentId },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Student Documents GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const studentId = parseInt((await params).id);

    // Only students can upload their own documents
    if (user.role !== "STUDENT" || parseInt(user.id) !== studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: "Missing file or document type" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX" },
        { status: 400 }
      );
    }

    try {
      // Upload file to AWS S3
      const s3Url = await uploadToS3(
        file,
        `documents/students/${studentId}`,
        `${documentType}_${Date.now()}`
      );

      // Create document record in database with S3 key
      const document = await db.studentDocument.create({
        data: {
          studentId,
          documentType,
          fileName: file.name,
          fileUrl: s3Url, // Store S3 key, not full URL
          fileSize: file.size,
          status: "PENDING",
        },
      });

      return NextResponse.json({
        success: true,
        document,
        message: "Document uploaded successfully to AWS S3",
      });
    } catch (s3Error) {
      console.error("S3 Upload Error:", s3Error);
      return NextResponse.json(
        { error: "Failed to upload document to cloud storage" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Student Documents POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE endpoint to remove a document
 */
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
    const studentId = parseInt((await params).id);

    // Only students can delete their own documents
    if (user.role !== "STUDENT" || parseInt(user.id) !== studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId" },
        { status: 400 }
      );
    }

    // Find the document
    const document = await db.studentDocument.findUnique({
      where: { id: documentId },
    });

    if (!document || document.studentId !== studentId) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    try {
      // Delete from S3
      const s3Key = extractS3KeyFromUrl(document.fileUrl);
      await deleteFromS3(s3Key);
    } catch (s3Error) {
      console.error("S3 Delete Error:", s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    await db.studentDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Student Documents DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
