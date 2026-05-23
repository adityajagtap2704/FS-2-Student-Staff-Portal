import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const staff = await db.staff.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true, assignedClass: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ staff });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    if (user.role !== "HOD") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { name, email, assignedClass } = await req.json();
    if (!name || !email) return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    const staff = await db.staff.create({
      data: { name, email, password: "changeme123", role: "CLASS_TEACHER", assignedClass: assignedClass || null, isActive: true },
      select: { id: true, name: true, email: true, role: true, assignedClass: true },
    });
    return NextResponse.json({ staff });
  } catch (err: any) {
    if (err.code === "P2002") return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
