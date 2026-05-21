import { NextResponse } from "next/server";
import db from "@/lib/db";

/**
 * PUBLIC endpoint to check admission status by reference number
 * No authentication required - allows public enquirers to track their application
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { referenceNumber } = body;

    if (!referenceNumber || !referenceNumber.trim()) {
      return NextResponse.json(
        { error: "Reference number is required" },
        { status: 400 }
      );
    }

    // Find admission by reference number (public lookup)
    const admission = await db.admission.findUnique({
      where: { referenceNumber: referenceNumber.trim().toUpperCase() },
    });

    if (!admission) {
      return NextResponse.json(
        { error: "Admission not found. Please check your reference number." },
        { status: 404 }
      );
    }

    // Return admission details (safe to expose publicly)
    return NextResponse.json({
      referenceNumber: admission.referenceNumber,
      studentName: admission.studentName,
      classApplied: admission.classApplied,
      status: admission.status,
      submittedAt: admission.submittedAt,
      approvedAt: admission.approvedAt,
      rejectionReason: admission.rejectionReason,
    });
  } catch (error) {
    console.error("Admission Status API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
