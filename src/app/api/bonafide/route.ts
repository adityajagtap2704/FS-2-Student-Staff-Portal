import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/bonafide
// STUDENT  → their own requests
// NON_TEACHING_STAFF → all requests with student info
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "STUDENT") {
      const studentId = parseInt(user.id);
      const requests = await db.bonafideRequest.findMany({
        where: { studentId },
        orderBy: { requestedAt: "desc" },
      });
      return NextResponse.json(requests);
    }

    if (user.role === "NON_TEACHING_STAFF") {
      const requests = await db.bonafideRequest.findMany({
        orderBy: { requestedAt: "desc" },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              rollNumber: true,
              classEnrolled: true,
            },
          },
        },
      });
      return NextResponse.json(requests);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("[BONAFIDE GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/bonafide
// STUDENT only — create a new bonafide request
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const studentId = parseInt(user.id);
    const body = await req.json();
    const { reason } = body;

    if (!reason?.trim()) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    // Prevent duplicate pending requests
    const existing = await db.bonafideRequest.findFirst({
      where: { studentId, status: "PENDING" },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending bonafide request. Please wait for it to be processed." },
        { status: 409 }
      );
    }

    const request = await db.bonafideRequest.create({
      data: {
        studentId,
        reason: reason.trim(),
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("[BONAFIDE POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
