import db from "@/lib/db";

export const MONTHLY_LIMIT = 2;
export const YEARLY_LIMIT  = MONTHLY_LIMIT * 12; // 24 days per year (2 days × 12 months)

/** Count days inclusive between two dates */
export function countDays(from: Date | string, to: Date | string): number {
  // Convert to Date objects
  let fromDate = typeof from === 'string' ? new Date(from) : new Date(from);
  let toDate = typeof to === 'string' ? new Date(to) : new Date(to);
  
  // Reset time to midnight UTC to avoid timezone issues
  fromDate = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()));
  toDate = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate()));
  
  // Calculate difference in milliseconds
  const diff = toDate.getTime() - fromDate.getTime();
  
  // Convert to days and add 1 to make it inclusive
  const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  
  return Math.max(1, days); // At least 1 day
}

export interface LeaveBalance {
  yearlyUsed:    number;
  yearlyPending: number;
  yearlyLimit:   number;
  yearlyRemaining: number;
  monthlyUsed:   number;
  monthlyPending: number;
  monthlyLimit:  number;
  monthlyRemaining: number;
  monthlyBreakdown: { month: string; used: number; pending: number; remaining: number }[];
}

export async function getLeaveBalance(id: number, isStaff: boolean = false): Promise<LeaveBalance> {
  const now   = new Date();
  const year  = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-indexed

  // Fetch APPROVED and PENDING requests to show reservation status in the UI
  const requests = await db.leaveRequest.findMany({
    where: {
      ...(isStaff ? { staffId: id } : { studentId: id }),
      status: { in: ["APPROVED", "PENDING"] },
      fromDate: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    },
  });

  const approvedRequests = requests.filter((r: any) => r.status === "APPROVED");
  const pendingRequests  = requests.filter((r: any) => r.status === "PENDING");

  const yearlyUsed = approvedRequests.reduce((acc: number, r: any) => acc + countDays(r.fromDate, r.toDate), 0);
  const yearlyPending = pendingRequests.reduce((acc: number, r: any) => acc + countDays(r.fromDate, r.toDate), 0);

  const getMonthBoundaries = (y: number, m: number) => {
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
    return { start, end };
  };

  const { start: monthStart, end: monthEnd } = getMonthBoundaries(year, month);

  const getMonthlySum = (reqList: typeof requests) => {
    const filtered = reqList.filter((r: any) => {
      const fromDate = new Date(r.fromDate);
      const toDate = new Date(r.toDate);
      return fromDate <= monthEnd && toDate >= monthStart;
    });
    return filtered.reduce((acc: number, r: any) => {
      const fromDate = new Date(r.fromDate);
      const toDate = new Date(r.toDate);
      const effectiveFrom = fromDate > monthStart ? fromDate : monthStart;
      const effectiveTo = toDate < monthEnd ? toDate : monthEnd;
      return acc + countDays(effectiveFrom, effectiveTo);
    }, 0);
  };

  const monthlyUsed = getMonthlySum(approvedRequests);
  const monthlyPending = getMonthlySum(pendingRequests);

  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  const monthlyBreakdown = monthNames.map((name, idx) => {
    const { start: mStart, end: mEnd } = getMonthBoundaries(year, idx);
    
    const getSumForMonth = (reqList: typeof requests) => {
      const filtered = reqList.filter((r: any) => {
        const fromDate = new Date(r.fromDate);
        const toDate = new Date(r.toDate);
        return fromDate <= mEnd && toDate >= mStart;
      });
      return filtered.reduce((acc: number, r: any) => {
        const fromDate = new Date(r.fromDate);
        const toDate = new Date(r.toDate);
        const effectiveFrom = fromDate > mStart ? fromDate : mStart;
        const effectiveTo = toDate < mEnd ? toDate : mEnd;
        return acc + countDays(effectiveFrom, effectiveTo);
      }, 0);
    };

    const used = getSumForMonth(approvedRequests);
    const pending = getSumForMonth(pendingRequests);
    
    return { 
      month: name, 
      used, 
      pending,
      remaining: Math.max(0, MONTHLY_LIMIT - used) 
    };
  });

  const yearlyRemainingFromMonthly = monthlyBreakdown.reduce(
    (acc: number, m: any) => acc + m.remaining,
    0
  );

  return {
    yearlyUsed,
    yearlyPending,
    yearlyLimit:      YEARLY_LIMIT,
    yearlyRemaining:  yearlyRemainingFromMonthly,
    monthlyUsed,
    monthlyPending,
    monthlyLimit:     MONTHLY_LIMIT,
    monthlyRemaining: Math.max(0, MONTHLY_LIMIT - monthlyUsed),
    monthlyBreakdown,
  };
}
