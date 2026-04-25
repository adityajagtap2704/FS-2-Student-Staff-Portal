import { NextResponse } from "next/server";
import prisma from "@/lib/db";

function generateRef() {
  const date = new Date();
  const yearMonth = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ENQ-${yearMonth}-${random}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentName, parentName, phone, email, grade, startDate, message } = body;

    // Validation
    if (!studentName || !parentName || !phone || !grade || !startDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const referenceNumber = generateRef();

    const admission = await prisma.admission.create({
      data: {
        referenceNumber,
        studentName,
        parentName,
        phone,
        classApplied: grade,
        status: "PENDING",
      },
    });

    return NextResponse.json(admission, { status: 201 });
  } catch (error) {
    console.error("Admission creation error:", error);
    return NextResponse.json({ error: "Failed to create admission enquiry" }, { status: 500 });
  }
}
