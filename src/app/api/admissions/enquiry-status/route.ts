import { NextResponse } from "next/server";
import db from "@/lib/db";

/**
 * Phase 3: Check enquiry status by enquiry number or email
 * Allows applicants to track their application status
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { enquiryNumber, email } = body;

    if (!enquiryNumber && !email) {
      return NextResponse.json(
        { error: "Enquiry number or email is required" },
        { status: 400 }
      );
    }

    // Find student by enquiry number or email
    let student = null;
    if (enquiryNumber) {
      student = await db.student.findFirst({
        where: { enquiryNumber },
      });
    } else if (email) {
      student = await db.student.findUnique({
        where: { email },
      });
    }

    if (!student) {
      return NextResponse.json(
        { error: "Enquiry not found" },
        { status: 404 }
      );
    }

    // Find admission record
    let admission = null;
    if (student.admissionId) {
      admission = await db.admission.findUnique({
        where: { id: student.admissionId },
      });
    }

    // Determine current stage
    let stage = "INITIAL_ENTRY";
    let stageDescription = "Account Created - Awaiting Application";

    if (student.status === "APPLICANT") {
      stage = "APPLICATION";
      stageDescription = "Application Submitted - Under Review";
    } else if (student.status === "STUDENT") {
      stage = "APPROVED";
      stageDescription = "Admission Approved - Portal Access Granted";
    } else if (student.status === "REJECTED") {
      stage = "REJECTED";
      stageDescription = "Application Rejected";
    }

    return NextResponse.json({
      enquiryNumber: student.enquiryNumber,
      email: student.email,
      name: student.name || "Not provided",
      status: student.status,
      stage,
      stageDescription,
      admission: admission ? {
        referenceNumber: admission.referenceNumber,
        status: admission.status,
        classApplied: admission.classApplied,
        submittedAt: admission.submittedAt,
        approvedAt: admission.approvedAt,
        rejectionReason: admission.rejectionReason,
      } : null,
      timeline: {
        accountCreated: student.createdAt,
        applicationSubmitted: admission?.submittedAt || null,
        approvedAt: admission?.approvedAt || null,
      },
    });
  } catch (error) {
    console.error("Enquiry Status Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
