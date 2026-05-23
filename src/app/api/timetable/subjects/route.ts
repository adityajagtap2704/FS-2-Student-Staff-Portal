import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const classLevel = searchParams.get("class");
    const subjects = await db.subject.findMany({
      where: classLevel ? { classLevel } : undefined,
      orderBy: [{ classLevel: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ subjects });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    if (user.role !== "HOD") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { name, code, color, classLevel } = await req.json();
    const subject = await db.subject.create({ data: { name, code, color, classLevel } });
    return NextResponse.json({ subject });
  } catch (err: any) {
    if (err.code === "P2002") return NextResponse.json({ error: "Subject code already exists" }, { status: 409 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
