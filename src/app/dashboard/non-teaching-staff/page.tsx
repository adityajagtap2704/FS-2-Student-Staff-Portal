import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import NonTeachingStaffClient from "./NonTeachingStaffClient";
import db from "@/lib/db";
import { getLeaveBalance } from "@/lib/leaveBalance";
import { prismaOrder } from "@/lib/sortOrder";

export default async function NonTeachingStaffPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "NON_TEACHING_STAFF") redirect("/dashboard");

  const staffId = parseInt(user.id);

  // Fetch staff details
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  if (!staff) redirect("/login");

  // Notices meant for all staff (not teaching-staff-only)
  const recentAnnouncements = await db.announcement.findMany({
    where: { target: { in: ["BOTH"] } },
    take: 5,
    orderBy: prismaOrder.announcement,
  });

  // Fetch leave requests (latest 5 for dashboard preview)
  const leaveRequests = await db.leaveRequest.findMany({
    where: { staffId },
    take: 5,
    orderBy: { submittedAt: "desc" },
  });

  // Real leave balance
  const leaveBalance = await getLeaveBalance(staffId, true);

  // Pending document count
  const pendingDocuments = await db.studentDocument.count({
    where: { status: "PENDING" },
  });

  // Pending admissions count
  const pendingAdmissions = await db.admission.count({
    where: { status: "PENDING" },
  });

  // Pending bonafide requests count
  const pendingBonafides = await db.bonafideRequest.count({
    where: { status: "PENDING" },
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <PageLayout session={session} title="Dashboard">
      <NonTeachingStaffClient
        staff={staff}
        greeting={greeting}
        announcements={recentAnnouncements}
        leaveRequests={leaveRequests}
        leaveBalance={leaveBalance}
        pendingDocuments={pendingDocuments}
        pendingAdmissions={pendingAdmissions}
        pendingBonafides={pendingBonafides}
      />
    </PageLayout>
  );
}
