"use client";

import { motion } from "framer-motion";
import { Staff, Announcement, LeaveRequest } from "@prisma/client";
import {
  Calendar, FileText, Bell, Clock, CheckCircle2, XCircle,
  AlertCircle, Users, ClipboardList, ShieldCheck, ArrowRight,
  CreditCard, Megaphone,
} from "lucide-react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { staggerContainer, easeOut } from "@/components/motion/MotionConfig";
import type { LeaveBalance } from "@/lib/leaveBalance";

interface Props {
  staff: Staff;
  greeting: string;
  announcements: Announcement[];
  leaveRequests: LeaveRequest[];
  leaveBalance: LeaveBalance;
  pendingDocuments: number;
  pendingAdmissions: number;
  pendingBonafides: number;
}

const leaveStatusConfig: Record<string, { variant: "success" | "danger" | "warning" | "neutral"; icon: React.ReactNode }> = {
  APPROVED: { variant: "success", icon: <CheckCircle2 size={12} /> },
  REJECTED: { variant: "danger",  icon: <XCircle size={12} /> },
  PENDING:  { variant: "warning", icon: <AlertCircle size={12} /> },
};

export default function NonTeachingStaffClient({
  staff,
  greeting,
  announcements,
  leaveRequests,
  leaveBalance,
  pendingDocuments,
  pendingAdmissions,
  pendingBonafides,
}: Props) {
  const pendingLeaves = leaveRequests.filter(l => l.status === "PENDING").length;

  return (
    <motion.div
      className="space-y-5"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={easeOut}>
        <h1 className="text-2xl font-bold text-[#444] tracking-tight">
          {greeting}, {staff.name}! 👋
        </h1>
        <p className="mt-1 text-sm text-gray-400">Welcome to your Non-Teaching Staff Portal</p>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-5 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0.05 }}
      >
        {/* Account Status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShieldCheck size={18} className="text-emerald-600" />
            </div>
            <Badge variant={staff.isActive ? "success" : "warning"} dot>
              {staff.isActive ? "Active" : "Pending"}
            </Badge>
          </div>
          <p className="text-2xl font-bold text-[#444]">{staff.isActive ? "Active" : "Pending"}</p>
          <p className="text-xs text-gray-400 mt-0.5">Account status</p>
        </div>

        {/* Leave Balance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Calendar size={18} className="text-blue-500" />
            </div>
            <Badge variant={leaveBalance.yearlyRemaining <= 3 ? "warning" : "success"} dot>
              {leaveBalance.yearlyRemaining}d left
            </Badge>
          </div>
          <p className="text-2xl font-bold text-[#444]">{leaveBalance.yearlyRemaining}</p>
          <p className="text-xs text-gray-400 mt-0.5">Days remaining this year</p>
        </div>

        {/* Pending Leave Requests */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock size={18} className="text-amber-500" />
            </div>
            {pendingLeaves > 0 && (
              <Badge variant="warning" dot>In review</Badge>
            )}
          </div>
          <p className="text-2xl font-bold text-[#444]">{pendingLeaves}</p>
          <p className="text-xs text-gray-400 mt-0.5">Pending leave requests</p>
        </div>

        {/* Pending Documents */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <ClipboardList size={18} className="text-purple-500" />
            </div>
            {pendingDocuments > 0 && (
              <Badge variant="info" dot>Action needed</Badge>
            )}
          </div>
          <p className="text-2xl font-bold text-[#444]">{pendingDocuments}</p>
          <p className="text-xs text-gray-400 mt-0.5">Documents to verify</p>
        </div>

        {/* Pending Bonafide Requests */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center">
              <FileText size={18} className="text-teal-600" />
            </div>
            {pendingBonafides > 0 && (
              <Badge variant="warning" dot>Action needed</Badge>
            )}
          </div>
          <p className="text-2xl font-bold text-[#444]">{pendingBonafides}</p>
          <p className="text-xs text-gray-400 mt-0.5">Bonafide requests</p>
        </div>
      </motion.div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Announcements */}
        <motion.div
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeOut, delay: 0.1 }}
        >
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-[#444]">Recent Announcements</h2>
            </div>
            <Link href="/dashboard/announcements" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-gray-50">
            {announcements.length > 0 ? (
              announcements.map((ann) => (
                <div key={ann.id} className="px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell size={14} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#444] truncate">{ann.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ann.description}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(ann.createdAt ?? new Date()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-10 text-center text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No announcements yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          className="bg-white rounded-2xl border border-gray-100 shadow-card p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeOut, delay: 0.15 }}
        >
          <h2 className="text-sm font-semibold text-[#444] mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: "/dashboard/non-teaching-staff/admissions",  icon: <Users size={16} className="text-blue-500" />,    bg: "bg-blue-50 hover:bg-blue-100",     label: "Admissions",          badge: pendingAdmissions > 0 ? pendingAdmissions : null },
              { href: "/dashboard/non-teaching-staff/documents",   icon: <ClipboardList size={16} className="text-purple-500" />, bg: "bg-purple-50 hover:bg-purple-100", label: "Document Verification", badge: pendingDocuments > 0 ? pendingDocuments : null },
              { href: "/dashboard/non-teaching-staff/bonafide",    icon: <FileText size={16} className="text-teal-600" />,  bg: "bg-teal-50 hover:bg-teal-100",     label: "Bonafide Approval",   badge: pendingBonafides > 0 ? pendingBonafides : null },
              { href: "/dashboard/leave",                          icon: <Calendar size={16} className="text-primary" />,   bg: "bg-primary-50 hover:bg-primary-100", label: "Apply for Leave",      badge: null },
              { href: "/dashboard/non-teaching-staff/installments",icon: <CreditCard size={16} className="text-emerald-500" />, bg: "bg-emerald-50 hover:bg-emerald-100", label: "Installment Requests", badge: null },
              { href: "/dashboard/announcements",                  icon: <Megaphone size={16} className="text-amber-500" />, bg: "bg-amber-50 hover:bg-amber-100",   label: "Create Announcements", badge: null },
              { href: "/dashboard/profile",                        icon: <FileText size={16} className="text-gray-500" />,  bg: "bg-gray-50 hover:bg-gray-100",     label: "My Profile",           badge: null },
            ].map(({ href, icon, bg, label, badge }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl ${bg} transition-colors group`}
              >
                <div className="flex items-center gap-2.5">
                  {icon}
                  <span className="text-sm font-medium text-[#444]">{label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {badge !== null && (
                    <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                      {badge}
                    </span>
                  )}
                  <ArrowRight size={14} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Leave History ── */}
      <motion.div
        className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0.2 }}
      >
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-[#444]">Recent Leave Requests</h2>
          </div>
          <Link href="/dashboard/leave" className="text-xs text-primary hover:underline flex items-center gap-1">
            Apply for leave <ArrowRight size={12} />
          </Link>
        </div>

        {leaveRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Leave Type", "From", "To", "Days", "Status"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leaveRequests.map((leave) => {
                  const days = Math.ceil(
                    (new Date(leave.toDate).getTime() - new Date(leave.fromDate).getTime()) / 86400000
                  ) + 1;
                  const cfg = leaveStatusConfig[leave.status ?? "PENDING"] ?? leaveStatusConfig["PENDING"];
                  return (
                    <tr key={leave.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 font-medium text-[#444]">{leave.leaveType}</td>
                      <td className="px-5 py-3 text-gray-500">{new Date(leave.fromDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                      <td className="px-5 py-3 text-gray-500">{new Date(leave.toDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                      <td className="px-5 py-3 text-gray-500">{days}d</td>
                      <td className="px-5 py-3">
                        <Badge variant={cfg.variant} dot>
                          {(leave.status ?? "PENDING").charAt(0) + (leave.status ?? "PENDING").slice(1).toLowerCase()}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-gray-400">
            <Calendar size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No leave requests yet</p>
            <Link href="/dashboard/leave" className="mt-2 inline-block text-xs text-primary hover:underline">
              Apply for leave →
            </Link>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
