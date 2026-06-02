import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import NotesClient from "./NotesClient";
import db from "@/lib/db";

export default async function NotesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  const role = user.role;

  // Block HOD and any other unauthorized roles
  if (role !== "CLASS_TEACHER" && role !== "STUDENT") {
    redirect("/dashboard");
  }

  // 1. Fetch all subjects to populate creation/filter dropdowns
  const subjectsData = await db.subject.findMany({
    select: { name: true, code: true },
    orderBy: { name: "asc" },
  });
  
  // Dedup subjects by name
  const subjects = Array.from(new Map(subjectsData.map(s => [s.name, s])).values());

  // 2. Fetch unique semesters/classes from Student table to populate dropdowns
  const uniqueClasses = await db.student.findMany({
    where: { 
      classEnrolled: { not: null },
      isActive: true 
    },
    distinct: ["classEnrolled"],
    select: { classEnrolled: true },
  });
  
  const semesters = uniqueClasses
    .map((c) => c.classEnrolled as string)
    .filter(Boolean)
    .sort((a, b) => {
      // Natural sorting (e.g. Class 6, Class 7 ... Class 10, Class 11)
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
    });

  // Add default semesters if none exist in active students
  if (semesters.length === 0) {
    semesters.push("Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6");
  }

  // 3. Fetch initial notes for SSR
  const whereClause: any = {};
  if (role === "STUDENT") {
    const student = await db.student.findUnique({
      where: { id: parseInt(user.id) },
      select: { classEnrolled: true },
    });
    const enrolledClass = student?.classEnrolled || "";
    
    whereClause.OR = [
      { semester: "All" },
      { semester: "" },
      { semester: null },
    ];
    if (enrolledClass) {
      whereClause.OR.push({ semester: enrolledClass });
    }
  }

  const initialNotes = await db.note.findMany({
    where: whereClause,
    orderBy: { uploadDate: "desc" },
  });

  // Convert decimal download count or nulls to standard JS numbers safely
  const serializedNotes = initialNotes.map(note => ({
    ...note,
    uploadDate: note.uploadDate ? note.uploadDate.toISOString() : null,
    downloadCount: note.downloadCount || 0,
  }));

  return (
    <PageLayout session={session} title="Notes & Materials">
      <NotesClient
        initialNotes={serializedNotes as any}
        role={role}
        userId={user.id}
        userName={user.name}
        subjects={subjects}
        semesters={semesters}
      />
    </PageLayout>
  );
}
