import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import LeaveClient from "./LeaveClient";
import db from "@/lib/db";
import { getLeaveBalance } from "@/lib/leaveBalance";

export default async function LeavePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  const userId = parseInt(user.id);
<<<<<<< HEAD
  const isStaff = user.role === "CLASS_TEACHER" || user.role === "HOD" || user.role === "NON_TEACHING_STAFF";
=======
  const isStaff = user.role === "CLASS_TEACHER" || user.role === "HOD";
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d

  // Fetch leave requests based on user type
  const leaveRequests = await db.leaveRequest.findMany({
    where: isStaff ? { staffId: userId } : { studentId: userId },
    orderBy: { submittedAt: "desc" },
  });

  // Get balance based on user type
  const balance = await getLeaveBalance(userId, isStaff);

  const stats = {
    total:     leaveRequests.length,
    approved:  leaveRequests.filter((r) => r.status === "APPROVED").length,
    pending:   leaveRequests.filter((r) => r.status === "PENDING").length,
    daysTaken: leaveRequests
      .filter((r) => r.status === "APPROVED")
      .reduce((acc, r) => {
        const diff = new Date(r.toDate).getTime() - new Date(r.fromDate).getTime();
        return acc + Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
      }, 0),
  };

  return (
    <PageLayout session={session} title="Leave">
      <LeaveClient initialData={leaveRequests} stats={stats} balance={balance} />
    </PageLayout>
  );
}
