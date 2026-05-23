import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getPenaltyLogsForFee,
  getTotalPenaltyForStudent,
  waivePenalty,
} from "@/lib/penaltyDb";

/**
 * GET /api/penalties
 * Get penalty information
 * Query params:
 * - feeId: Get penalties for specific fee
 * - studentId: Get total penalties for student
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const feeId = url.searchParams.get("feeId");
    const studentId = url.searchParams.get("studentId");

    if (feeId) {
      // Get penalties for specific fee
      const logs = await getPenaltyLogsForFee(Number(feeId));
      return NextResponse.json({
        success: true,
        penalties: logs,
      });
    }

    if (studentId) {
      // Only HOD or the student themselves can view
      if (user?.role !== "HOD" && Number(user?.id) !== Number(studentId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const totalPenalty = await getTotalPenaltyForStudent(Number(studentId));
      return NextResponse.json({
        success: true,
        totalPenalty: totalPenalty.toString(),
      });
    }

    return NextResponse.json(
      { error: "Missing query parameters" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[PENALTY API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/penalties/waive
 * HOD waives penalty for a fee
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || user?.role !== "HOD") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { feeId, reason } = body;

    if (!feeId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await waivePenalty({
      feeId,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: "Penalty waived successfully",
      result,
    });
  } catch (error: any) {
    console.error("[PENALTY API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
