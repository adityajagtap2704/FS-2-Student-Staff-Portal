import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { countDays, YEARLY_LIMIT, MONTHLY_LIMIT } from "@/lib/leaveBalance";
import { validateLeaveForm } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    
    if (!session || !["CLASS_TEACHER", "HOD", "NON_TEACHING_STAFF"].includes(user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const staffId = parseInt(user.id);
    const body = await req.json();
    const { type, from, to, reason } = body;

    // Input validation
    const validation = validateLeaveForm({ type, from, to, reason });
    if (!validation.valid) {
      return NextResponse.json({ errors: validation.errors }, { status: 422 });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

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
        staffId,
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

    // Get current year and month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Count PENDING requests to prevent over-submission
    const pendingRequests = await db.leaveRequest.findMany({
      where: {
        staffId,
        status: "PENDING",
        fromDate: {
          gte: new Date(`${currentYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`),
        },
      },
    });
    const pendingDays = pendingRequests.reduce(
      (acc, r) => acc + countDays(r.fromDate, r.toDate),
      0
    );

    // Get approved requests for balance calculation
    const approvedRequests = await db.leaveRequest.findMany({
      where: {
        staffId,
        status: "APPROVED",
        fromDate: {
          gte: new Date(`${currentYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`),
        },
      },
    });
    const approvedDays = approvedRequests.reduce(
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

      const approvedThisMonth = approvedRequests.filter((r) => {
        const d = new Date(r.fromDate);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }).reduce((acc, r) => acc + countDays(r.fromDate, r.toDate), 0);

      const monthlyUsed = approvedThisMonth + pendingThisMonth;
      const monthlyRemaining = Math.max(0, MONTHLY_LIMIT - monthlyUsed);

      if (monthlyUsed + requestedDays > MONTHLY_LIMIT) {
        return NextResponse.json(
          {
            error: `Monthly leave limit exceeded. You have ${monthlyRemaining} day(s) remaining this month (limit: ${MONTHLY_LIMIT}/month), plus ${pendingThisMonth} day(s) pending.`,
            code: "MONTHLY_LIMIT_EXCEEDED",
            remaining: monthlyRemaining,
          },
          { status: 422 }
        );
      }
    }

    // Check yearly limit (including PENDING)
    const yearlyUsed = approvedDays + pendingDays;
    const yearlyRemaining = Math.max(0, YEARLY_LIMIT - yearlyUsed);

    if (yearlyUsed + requestedDays > YEARLY_LIMIT) {
      return NextResponse.json(
        {
          error: `Yearly leave limit exceeded. You have ${yearlyRemaining} day(s) remaining this year (limit: ${YEARLY_LIMIT}/year), plus ${pendingDays} day(s) pending.`,
          code: "YEARLY_LIMIT_EXCEEDED",
          remaining: yearlyRemaining,
        },
        { status: 422 }
      );
    }

    // Create leave request
    const leaveRequest = await db.leaveRequest.create({
      data: {
        staffId,
        leaveType: type,
        fromDate,
        toDate,
        reason,
        status: "PENDING",
      },
    });

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error("Staff Leave Request Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
