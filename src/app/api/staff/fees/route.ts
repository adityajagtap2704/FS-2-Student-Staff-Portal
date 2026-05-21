import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session || user?.role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const assignedClass = String(user.assignedClass || "");
    if (!assignedClass) {
      return NextResponse.json({ error: "No class assigned" }, { status: 422 });
    }

    const students = await db.student.findMany({
      where: { classEnrolled: assignedClass, isActive: true },
      select: { id: true, name: true, rollNumber: true, classEnrolled: true },
      orderBy: [{ rollNumber: "asc" }, { id: "asc" }],
    });

    const fees = await db.fee.findMany({
      where: { student: { classEnrolled: assignedClass } },
      include: { student: { select: { id: true, name: true, rollNumber: true, classEnrolled: true } } },
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
    });

    const byStudent: Record<string, any> = {};
    for (const s of students) {
      byStudent[String(s.id)] = { student: s, fees: [], summary: { total: 0, paid: 0, outstanding: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 } };
    }

    for (const f of fees) {
      const sid = String(f.studentId);
      if (!byStudent[sid]) {
        byStudent[sid] = { student: f.student, fees: [], summary: { total: 0, paid: 0, outstanding: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 } };
      }
      byStudent[sid].fees.push(f);
      byStudent[sid].summary.total += Number(f.amount);
      byStudent[sid].summary.paid += Number(f.paidAmount);
      if (f.status === "PAID") byStudent[sid].summary.paidCount += 1;
      if (f.status === "PENDING") byStudent[sid].summary.pendingCount += 1;
      if (f.status === "OVERDUE") byStudent[sid].summary.overdueCount += 1;
    }

    for (const sid of Object.keys(byStudent)) {
      byStudent[sid].summary.outstanding = byStudent[sid].summary.total - byStudent[sid].summary.paid;
    }

    const rows = Object.values(byStudent).sort((a: any, b: any) => {
      const ar = a.student?.rollNumber ?? "";
      const br = b.student?.rollNumber ?? "";
      return ar.localeCompare(br);
    });

    return NextResponse.json({ class: assignedClass, students: rows });
  } catch (error) {
    console.error("Staff Fees Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

