import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import Link from "next/link";
import { CreditCard, CalendarOff, Megaphone, ArrowRight, TrendingUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import DashboardClient from "./DashboardClient";
import db from "@/lib/db";

const quickLinks = [
  { href: "/dashboard/fees",          label: "Pay Fees",      icon: "credit",   color: "text-primary",   bg: "bg-primary-50" },
  { href: "/dashboard/leave",         label: "Leave",         icon: "calendar", color: "text-amber-600", bg: "bg-amber-50"   },
  { href: "/dashboard/announcements", label: "Notices",       icon: "megaphone",color: "text-blue-600",  bg: "bg-blue-50"    },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Fetch fees summary
  const user = session.user as { id: string };
  const studentId = parseInt(user.id);
  const fees = await db.fee.findMany({
    where: { studentId },
    orderBy: { dueDate: "asc" },
  });
  const totalDue = fees.reduce((acc, f) => acc + Number(f.amount), 0);
  const totalPaid = fees.reduce((acc, f) => acc + Number(f.paidAmount), 0);
  const outstanding = totalDue - totalPaid;
  const feesSummary = { totalDue, totalPaid, outstanding };

  // Fetch recent activities
  const recentFees = fees.filter(f => f.status === 'PAID').slice(0, 1); // Show one recent paid fee
  const recentLeaves = await db.leaveRequest.findMany({
    where: { studentId },
    orderBy: { submittedAt: 'desc' },
    take: 1,
  });
  const recentAnnouncements = await db.announcement.findMany({
    orderBy: { date: 'desc' },
    take: 2,
  });
  const overdueFees = fees.filter(f => f.status === 'OVERDUE').slice(0, 1);

  const activities = [];

  // Add recent paid fee
  if (recentFees.length > 0) {
    const fee = recentFees[0];
    activities.push({
      icon: "check",
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-50",
      title: "Fee payment received",
      sub: `${fee.term} – ₹${(fee.paidAmount || 0).toLocaleString()} cleared`,
      time: "2 hours ago",
      badge: "success" as const,
      badgeLabel: "Paid"
    });
  }

  // Add recent leave request
  if (recentLeaves.length > 0) {
    const leave = recentLeaves[0];
    activities.push({
      icon: "clock",
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50",
      title: "Leave request submitted",
      sub: `${leave.leaveType} – ${leave.fromDate.toDateString()}`,
      time: "Yesterday",
      badge: "warning" as const,
      badgeLabel: leave.status === 'APPROVED' ? 'Approved' : 'Pending'
    });
  }

  // Add recent announcements
  recentAnnouncements.forEach(ann => {
    activities.push({
      icon: "megaphone",
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50",
      title: "New announcement posted",
      sub: `${ann.title} – ${ann.date.toDateString()}`,
      time: "2 days ago",
      badge: "info" as const,
      badgeLabel: "New"
    });
  });

  // Add overdue fee if any
  if (overdueFees.length > 0) {
    const fee = overdueFees[0];
    activities.push({
      icon: "alert",
      iconColor: "text-red-500",
      iconBg: "bg-red-50",
      title: "Fee payment overdue",
      sub: `${fee.term} – ₹${(Number(fee.amount) - Number(fee.paidAmount || 0)).toLocaleString()} due ${fee.dueDate.toDateString()}`,
      time: "3 days ago",
      badge: "danger" as const,
      badgeLabel: "Overdue"
    });
  }

  // Limit to 4 activities
  const activity = activities.slice(0, 4);

  return (
    <PageLayout session={session} title="Dashboard">
      <DashboardClient
        session={session}
        greeting={greeting}
        activity={activity}
        quickLinks={quickLinks}
        feesSummary={feesSummary}
      />
    </PageLayout>
  );
}
