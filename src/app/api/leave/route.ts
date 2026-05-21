import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLeaveBalance, countDays, YEARLY_LIMIT, MONTHLY_LIMIT } from "@/lib/leaveBalance";
import { validateLeaveForm } from "@/lib/validation";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user      = session.user as any;
    const studentId = parseInt(user.id);

    const leaveRequests = await db.leaveRequest.findMany({
      where: { studentId },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(leaveRequests);
  } catch (error) {
    console.error("Leave GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user      = session.user as any;
    const studentId = parseInt(user.id);
    const body      = await req.json();
    const { type, from, to, reason } = body;

    // Phase 3: Input validation using validation utility
    const validation = validateLeaveForm({ type, from, to, reason });
    if (!validation.valid) {
      return NextResponse.json({ errors: validation.errors }, { status: 422 });
    }

    const fromDate = new Date(from);
    const toDate   = new Date(to);

    const requestedDays = countDays(fromDate, toDate);
    
    // Validate maximum leave duration per request (30 days)
    if (requestedDays > 30) {
      return NextResponse.json({ 
        error: "Maximum 30 days allowed per leave request" 
      }, { status: 422 });
    }

    // Check for overlapping leave requests (PENDING or APPROVED)
    const overlap = await db.leaveRequest.findFirst({
      where: {
        studentId,
        status: { in: ["PENDING", "APPROVED"] },
        fromDate: { lte: toDate },
        toDate: { gte: fromDate },
      },
    });

    if (overlap) {
      return NextResponse.json({
        error: "You already have a leave request for these dates",
        code: "OVERLAPPING_LEAVE",
      }, { status: 409 });
    }

    const balance       = await getLeaveBalance(studentId);

    // Fix #3 — check monthly limit for ALL months the leave spans, not just start month
    const now = new Date();
    const currentYear  = now.getFullYear();
    const currentMonth = now.getMonth();

    // Also count PENDING requests to prevent over-submission
    const pendingRequests = await db.leaveRequest.findMany({
      where: {
        studentId,
        status: "PENDING",
        fromDate: {
          gte: new Date(`${now.getFullYear()}-01-01`),
          lte: new Date(`${now.getFullYear()}-12-31`),
        },
      },
    });
    const pendingDays = pendingRequests.reduce(
      (acc, r) => acc + countDays(r.fromDate, r.toDate),
      0
    );

    // Build a set of year-month pairs this request spans
    const spannedMonths = new Set<string>();
    const cursor = new Date(fromDate);
    while (cursor <= toDate) {
      spannedMonths.add(`${cursor.getFullYear()}-${cursor.getMonth()}`);
      cursor.setMonth(cursor.getMonth() + 1);
      cursor.setDate(1);
    }

    // Check monthly limit for current month if it's spanned (including PENDING)
    if (spannedMonths.has(`${currentYear}-${currentMonth}`)) {
      const pendingThisMonth = pendingRequests.filter((r) => {
        const d = new Date(r.fromDate);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }).reduce((acc, r) => acc + countDays(r.fromDate, r.toDate), 0);

      if (balance.monthlyUsed + pendingThisMonth + requestedDays > MONTHLY_LIMIT) {
        return NextResponse.json(
          {
            error: `Monthly leave limit exceeded. You have ${balance.monthlyRemaining} day(s) remaining this month (limit: ${MONTHLY_LIMIT}/month), plus ${pendingThisMonth} day(s) pending.`,
            code:  "MONTHLY_LIMIT_EXCEEDED",
            remaining: balance.monthlyRemaining,
          },
          { status: 422 }
        );
      }
    }

    // Check yearly limit (including PENDING)
    if (balance.yearlyUsed + pendingDays + requestedDays > YEARLY_LIMIT) {
      return NextResponse.json(
        {
          error: `Yearly leave limit exceeded. You have ${balance.yearlyRemaining} day(s) remaining this year (limit: ${YEARLY_LIMIT}/year), plus ${pendingDays} day(s) pending.`,
          code:  "YEARLY_LIMIT_EXCEEDED",
          remaining: balance.yearlyRemaining,
        },
        { status: 422 }
      );
    }

    const leaveRequest = await db.leaveRequest.create({
      data: {
        studentId,
        leaveType: type,
        fromDate,
        toDate,
        reason,
        status: "PENDING",
      },
    });

    // Phase 3: Audit log (commented for now)
    // logLeaveAction("CREATE", leaveRequest.id, user.id, user.role, true);

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error("Leave POST Error:", error);
    // logLeaveAction("CREATE", 0, "unknown", "STUDENT", false, String(error));
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
