import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET — Fetch student profile data
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user      = session.user as any;
    if (user.role !== "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const studentId = parseInt(user.id);

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        fees: true,
        leaveRequests: true,
      },
    });

    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    return NextResponse.json({ student });
  } catch (error) {
    console.error("Profile GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Fix #8 — students can update their phone and parent name
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user      = session.user as any;
    if (user.role !== "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const studentId = parseInt(user.id);
    const body      = await req.json();
    const { phone, parentName } = body;

    const errors: Record<string, string> = {};
    if (!phone?.trim())      errors.phone      = "Phone is required";
    else if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) 
      errors.phone = "Phone must be exactly 10 digits";
    
    if (!parentName?.trim()) errors.parentName = "Parent name is required";
    else if (parentName.trim().length < 3) 
      errors.parentName = "Parent name must be at least 3 characters";
    
    if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });

    const updated = await db.student.update({
      where: { id: studentId },
      data: {
        phone:      phone.trim(),
        parentName: parentName.trim(),
      },
    });

    return NextResponse.json({ phone: updated.phone, parentName: updated.parentName });
  } catch (error) {
    console.error("Profile PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
