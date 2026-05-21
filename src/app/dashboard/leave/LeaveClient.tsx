"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarOff, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LeaveRequestForm from "./LeaveRequestForm";
import { staggerContainer, easeOut } from "@/components/motion/MotionConfig";
import { useToast } from "@/components/ui/Toast";
import type { LeaveBalance } from "@/lib/leaveBalance";

interface Props {
  initialData: any[];
  stats: {
    total: number;
    approved: number;
    pending: number;
    daysTaken: number;
  };
  balance: LeaveBalance;
}

export default function LeaveClient({ initialData, stats, balance }: Props) {
  const toast = useToast();
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(balance);
<<<<<<< HEAD
  const [isStaff, setIsStaff] = useState(false);

  // Detect role once on mount
  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(s => {
        const role = s?.user?.role;
        setIsStaff(["CLASS_TEACHER", "HOD", "NON_TEACHING_STAFF"].includes(role));
      })
      .catch(() => {});
  }, []);

  // Auto-refresh every 30 seconds to check for HOD approvals
  useEffect(() => {
    const interval = setInterval(() => refreshData(), 30000);
    return () => clearInterval(interval);
  }, [isStaff]);
=======

  // Auto-refresh every 30 seconds to check for HOD approvals
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
<<<<<<< HEAD
      // Use the correct endpoint based on role
      const endpoint = isStaff ? "/api/staff/leave" : "/api/leave";
      const leaveRes = await fetch(endpoint);
      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        setData(Array.isArray(leaveData) ? leaveData : []);
=======
      
      // Fetch leave requests from the same endpoint used by the server
      const leaveRes = await fetch("/api/leave");
      
      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        setData(Array.isArray(leaveData) ? leaveData : []);
        
        // Recalculate balance on client side from the fetched data
        // Get the latest balance by re-fetching the page or using the existing data
        // For now, just update the data and let the page refresh show updated balance
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
      } else {
        console.error("Failed to refresh leave data:", leaveRes.status);
      }
    } catch (error) {
      console.error("Error refreshing leave data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const monthlyUsedPct    = Math.round((currentBalance.monthlyUsed    / currentBalance.monthlyLimit) * 100);
  const monthlyPendingPct = Math.round((currentBalance.monthlyPending / currentBalance.monthlyLimit) * 100);
  const yearlyUsedPct     = Math.round((currentBalance.yearlyUsed     / currentBalance.yearlyLimit)  * 100);
  const yearlyPendingPct  = Math.round((currentBalance.yearlyPending  / currentBalance.yearlyLimit)  * 100);

<<<<<<< HEAD
  // Cancel a PENDING leave request — uses role-appropriate endpoint
  const handleCancel = async (id: number) => {
    let res: Response;
    if (isStaff) {
      res = await fetch("/api/staff/leave", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } else {
      res = await fetch(`/api/leave/${id}`, { method: "DELETE" });
    }
=======
  // Fix #14 — cancel a PENDING leave request
  const handleCancel = async (id: number) => {
    const res = await fetch(`/api/leave/${id}`, { method: "DELETE" });
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
    if (res.ok) {
      setData(prev => prev.filter(r => r.id !== id));
      toast.success("Request cancelled", "Your leave request has been removed.");
    } else {
      const err = await res.json();
      toast.error("Cannot cancel", err.error ?? "Please try again.");
    }
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={easeOut}>
        <h1 className="text-2xl font-bold text-[#444] tracking-tight">Leave Requests</h1>
        <p className="mt-1 text-sm text-gray-400">Submit and track your leave requests.</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <StatCard label="Total Requests" value={data.length.toString()} sub="This academic year"
          icon={<CalendarOff size={18} className="text-primary" />} iconBg="bg-primary-50" delay={0.05} />
        <StatCard label="Approved" value={data.filter((r) => r.status === "APPROVED").length.toString()} sub={`${data.filter((r) => r.status === "APPROVED").reduce((acc, r) => acc + Math.ceil((new Date(r.toDate).getTime() - new Date(r.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1, 0)} days taken`}
          icon={<CheckCircle2 size={18} className="text-emerald-600" />} iconBg="bg-emerald-50"
          badge="Cleared" badgeVariant="success" delay={0.1} />
        <StatCard label="Pending" value={data.filter((r) => r.status === "PENDING").length.toString()} sub="Awaiting review"
          icon={<Clock size={18} className="text-amber-500" />} iconBg="bg-amber-50"
          badge="In review" badgeVariant="warning" delay={0.15} />
      </motion.div>

      {/* Leave Balance Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0.18 }}
      >
        {/* Monthly */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">This Month</p>
            <Badge
              variant={currentBalance.monthlyRemaining === 0 ? "danger" : currentBalance.monthlyRemaining === 1 ? "warning" : "success"}
              dot
            >
              {currentBalance.monthlyUsed} of {currentBalance.monthlyLimit} days used
            </Badge>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
            <motion.div
              className={`h-full ${monthlyUsedPct >= 100 ? "bg-red-400" : "bg-emerald-400"}`}
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(monthlyUsedPct, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">{currentBalance.monthlyRemaining} remaining · {currentBalance.monthlyLimit} total</p>
        </div>

        {/* Yearly */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">This Year</p>
            <Badge
              variant={currentBalance.yearlyRemaining === 0 ? "danger" : currentBalance.yearlyRemaining <= 3 ? "warning" : "success"}
              dot
            >
              {currentBalance.yearlyUsed} of {currentBalance.yearlyLimit} days used
            </Badge>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
            <motion.div
              className={`h-full ${yearlyUsedPct >= 100 ? "bg-red-400" : "bg-emerald-400"}`}
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(yearlyUsedPct, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">{currentBalance.yearlyRemaining} remaining · {currentBalance.yearlyLimit} total</p>
        </div>
      </motion.div>

      {/* Monthly Breakdown */}
      <Card title="Monthly Breakdown" subtitle="Leave usage per month" delay={0.22}>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {currentBalance.monthlyBreakdown.map((m) => (
            <div key={m.month} className="text-center">
              <p className="text-[10px] text-gray-400 mb-1">{m.month}</p>
              <div className="h-12 w-full bg-gray-50 rounded-lg flex flex-col items-center justify-end overflow-hidden relative">
                {/* Used portion */}
                <motion.div
                  className={`w-full rounded-lg ${m.used >= 2 ? "bg-red-300" : m.used === 1 ? "bg-emerald-300" : "bg-emerald-200"}`}
                  initial={{ height: "0%" }}
                  animate={{ height: m.used > 0 ? `${(m.used / 2) * 100}%` : "4px" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] font-medium text-gray-500 mt-1">
                {m.used}/{2}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Leave Request Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...easeOut, delay: 0.25 }}>
        <LeaveRequestForm balance={currentBalance} />
      </motion.div>

      {/* History Table */}
      <Card title="Leave History" subtitle="All your previous requests" noPadding delay={0.3}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {["Reason", "From", "To", "Days", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row, i) => {
                const diff = new Date(row.toDate).getTime() - new Date(row.fromDate).getTime();
                const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
                const statusVariant = row.status === "APPROVED" ? "success" : row.status === "REJECTED" ? "danger" : "warning";
                return (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...easeOut, delay: 0.35 + i * 0.07 }}
                    whileHover={{ backgroundColor: "rgba(249,250,251,0.8)" }}
                    className="transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-[#444]">{row.reason}</td>
                    <td className="px-6 py-4 text-gray-400">{new Date(row.fromDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-400">{new Date(row.toDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-400">{days}d</td>
                    <td className="px-6 py-4"><Badge variant={statusVariant} dot>{row.status.charAt(0) + row.status.slice(1).toLowerCase()}</Badge></td>
                    <td className="px-6 py-4">
                      {/* Fix #14 — cancel button for PENDING only */}
                      {row.status === "PENDING" ? (
                        <Button size="xs" variant="danger" onClick={() => handleCancel(row.id)}>
                          Cancel
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No leave requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
