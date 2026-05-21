import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

/**
 * GET /api/non-teaching-staff/installments
 * Non-teaching staff fetches all installment requests
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || user?.role !== "NON_TEACHING_STAFF") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status") || "ALL";

    const where =
      statusFilter !== "ALL"
        ? { status: statusFilter as "PENDING" | "APPROVED" | "REJECTED" }
        : {};

    const requests = await db.installmentRequest.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            classEnrolled: true,
            rollNumber: true,
            parentEmail: true,
          },
        },
        fee: {
          select: {
            id: true,
            term: true,
            amount: true,
            paidAmount: true,
            dueDate: true,
            status: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("[INSTALLMENT GET] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
