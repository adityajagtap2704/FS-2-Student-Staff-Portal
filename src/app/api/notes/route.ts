import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToS3 } from "@/lib/aws-s3";
import { createNotificationNoDuplicates } from "@/lib/notificationHelper";

// ── GET: Fetch Notes ─────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "CLASS_TEACHER" && user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const subject = searchParams.get("subject") || "";
    const semester = searchParams.get("semester") || "";
    const mineOnly = searchParams.get("mine") === "true";

    // Setup base query filters
    const whereClause: any = {};

    // 1. Role-based restrictions
    if (user.role === "STUDENT") {
      // Find the student's enrolled class
      const student = await db.student.findUnique({
        where: { id: parseInt(user.id) },
        select: { classEnrolled: true },
      });

      const enrolledClass = student?.classEnrolled || "";

      // Students can only see notes for their class/semester or marked as "All"
      whereClause.OR = [
        { semester: "All" },
        { semester: "" },
        { semester: null },
      ];

      if (enrolledClass) {
        whereClause.OR.push({ semester: enrolledClass });
      }
    } else if (mineOnly) {
      // Teachers can filter to see only their uploads
      whereClause.staffId = parseInt(user.id);
    }

    // 2. Additional filter inputs
    if (subject && subject !== "All") {
      whereClause.subject = subject;
    }
    
    if (semester && semester !== "All") {
      if (user.role !== "STUDENT") {
        whereClause.semester = semester;
      } else {
        // If student is asking for a specific filter, it must still be valid for them
        whereClause.semester = semester;
      }
    }

    // 3. Keyword Search (title, description, teacher name)
    if (search) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
            { teacherName: { contains: search } },
          ],
        },
      ];
    }

    const notes = await db.note.findMany({
      where: whereClause,
      orderBy: { uploadDate: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Notes GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── POST: Upload Notes ────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    // Only teachers (CLASS_TEACHER) can upload notes
    if (user.role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Forbidden. Only teachers can publish notes." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const subject = formData.get("subject") as string;
    const section = (formData.get("section") as string) || "All";
    const semester = (formData.get("semester") as string) || "All";
    const description = formData.get("description") as string;

    if (!file || !title || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: Title, Subject, and File are mandatory." },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds the 10MB limit." },
        { status: 400 }
      );
    }

    // Validate file extension
    const allowedExtensions = ["pdf", "ppt", "pptx", "doc", "docx", "png", "jpg", "jpeg", "webp"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed formats: PDF, PPT, PPTX, DOC, DOCX, JPG, PNG, WEBP." },
        { status: 400 }
      );
    }

    // Upload to AWS S3
    const folder = `notes/${semester.replace(/\s+/g, "_")}`;
    const s3Key = await uploadToS3(
      file,
      folder,
      `note_${Date.now()}.${fileExtension}`
    );

    // Save in Database
    const note = await db.note.create({
      data: {
        title: title.trim(),
        subject: subject.trim(),
        section,
        semester,
        teacherName: user.name || "Teacher",
        description: description?.trim() || null,
        fileName: file.name,
        fileUrl: s3Key,
        staffId: parseInt(user.id),
      },
    });

    // Notify matching students
    try {
      const studentFilter: any = { isActive: true, status: "STUDENT" };
      if (semester && semester !== "All") {
        studentFilter.classEnrolled = semester;
      }

      const students = await db.student.findMany({
        where: studentFilter,
        select: { id: true },
      });

      const messageContent = `${user.name} uploaded new notes for ${subject}: "${title.trim()}"`;
      
      for (const student of students) {
        await createNotificationNoDuplicates(
          student.id,
          "GENERAL",
          "New Study Notes Available",
          messageContent,
          30 // 30 minutes window to avoid duplicate clicks
        );
      }
    } catch (notifError) {
      console.error("Failed to generate student notifications for upload:", notifError);
    }

    return NextResponse.json({
      success: true,
      message: "Note published successfully!",
      note,
    });

  } catch (error) {
    console.error("Notes POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
