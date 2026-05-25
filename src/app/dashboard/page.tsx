import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import DashboardClient from "./DashboardClient";
import db from "@/lib/db";
import { compareDesc, prismaOrder } from "@/lib/sortOrder";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as { id: string; role: string };

  // Check user role first
  if (user.role === "HOD") {
    redirect("/dashboard/hod");
  }

  if (user.role === "CLASS_TEACHER") {
    redirect("/dashboard/staff");
  }

  if (user.role === "NON_TEACHING_STAFF") {
    redirect("/dashboard/non-teaching-staff");
  }

  // Only students can access this dashboard
  if (user.role !== "STUDENT") {
    redirect("/login");
  }

  const studentId = parseInt(user.id);

  // Phase 3: Check student status and redirect accordingly
  const student = await db.student.findUnique({
    where: { id: studentId },
  });

  // If student not found, redirect to login
  if (!student) {
    redirect("/login");
  }

  // Stage 1 & 2: PRE_APPLICANT or APPLICANT - redirect to application status
  if (student.status === "PRE_APPLICANT" || student.status === "APPLICANT") {
    redirect("/dashboard/application-status");
  }

  // Stage 3: REJECTED - redirect to application status
  if (student.status === "REJECTED") {
    redirect("/dashboard/application-status");
  }

  // 1. Fetch Fees for Stats
  const fees = await db.fee.findMany({
    where: { studentId },
    orderBy: prismaOrder.fee,
  });

  const totalDue = fees.reduce((acc, f) => acc + Number(f.amount), 0);
  const totalPaid = fees.reduce((acc, f) => acc + Number(f.paidAmount), 0);
  const outstanding = totalDue - totalPaid;

  // 2. Fetch Recent Activities
  // Announcements
  const recentAnnouncements = await db.announcement.findMany({
    where: {
      target: { in: ["STUDENT", "BOTH"] }
    },
    take: 3,
    orderBy: prismaOrder.announcement,
  });

  // Leave Requests
  const recentLeave = await db.leaveRequest.findMany({
    where: { studentId },
    take: 10,
    orderBy: prismaOrder.submittedAt,
  });

  const paidFees = fees.filter((f) => f.status === "PAID");

  // Combine activity — newest first across announcements, leave, fees
  type ActivityRow = {
    sortAt: Date;
    icon: string;
    iconColor: string;
    iconBg: string;
    title: string;
    sub: string;
    time: string;
    badge: "info" | "success" | "danger" | "warning";
    badgeLabel: string;
  };

  const activityRows: ActivityRow[] = [
    ...recentAnnouncements.map((a) => ({
      sortAt: new Date(a.createdAt ?? a.date),
      icon: "megaphone",
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50",
      title: "New announcement posted",
      sub: a.title,
      time: formatDate(a.createdAt ?? a.date),
      badge: "info" as const,
      badgeLabel: "New",
    })),
    ...recentLeave.map((l) => ({
      sortAt: new Date(l.submittedAt ?? new Date()),
      icon: "clock",
      iconColor:
        (l.status ?? "PENDING") === "APPROVED"
          ? "text-emerald-500"
          : (l.status ?? "PENDING") === "REJECTED"
            ? "text-red-500"
            : "text-amber-500",
      iconBg:
        (l.status ?? "PENDING") === "APPROVED"
          ? "bg-emerald-50"
          : (l.status ?? "PENDING") === "REJECTED"
            ? "bg-red-50"
            : "bg-amber-50",
      title: "Leave request " + (l.status ?? "pending").toLowerCase(),
      sub: l.reason,
      time: formatDate(l.submittedAt ?? new Date()),
      badge: ((l.status ?? "PENDING") === "APPROVED"
        ? "success"
        : (l.status ?? "PENDING") === "REJECTED"
          ? "danger"
          : "warning") as ActivityRow["badge"],
      badgeLabel: (l.status ?? "PENDING").charAt(0) + (l.status ?? "PENDING").slice(1).toLowerCase(),
    })),
    ...paidFees.slice(0, 5).map((f) => ({
      sortAt: new Date(f.paidAt ?? f.dueDate),
      icon: "check",
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-50",
      title: "Fee payment received",
      sub: `${f.term} – ₹${Number(f.paidAmount).toLocaleString()} cleared`,
      time: formatDate(f.paidAt ?? f.dueDate),
      badge: "success" as const,
      badgeLabel: "Paid",
    })),
  ].sort((a, b) => compareDesc(a.sortAt, b.sortAt));

  const activityData = activityRows.slice(0, 4).map(({ sortAt: _s, ...rest }) => rest);

  const stats = {
    totalFees: `₹${totalDue.toLocaleString()}`,
    paid: `₹${totalPaid.toLocaleString()}`,
    outstanding: `₹${outstanding.toLocaleString()}`,
    paidPercent: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0,
    termCount: fees.length,
    academicYear: new Date().getFullYear(),
  };

  const quickLinks = [
    { href: "/dashboard/fees",          label: "Pay Fees",      icon: "credit",   color: "text-primary",   bg: "bg-primary-50" },
    { href: "/dashboard/leave",         label: "Leave",         icon: "calendar", color: "text-amber-600", bg: "bg-amber-50"   },
    { href: "/dashboard/bonafide",      label: "Bonafide",      icon: "file",     color: "text-purple-600",bg: "bg-purple-50"  },
    { href: "/dashboard/announcements", label: "Notices",       icon: "megaphone",color: "text-blue-600",  bg: "bg-blue-50"    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <PageLayout session={session} title="Dashboard">
      <DashboardClient
        session={session}
        greeting={greeting}
        activity={activityData.slice(0, 4)}
        quickLinks={quickLinks}
        stats={stats}
      />
    </PageLayout>
  );
}

function formatDate(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}
