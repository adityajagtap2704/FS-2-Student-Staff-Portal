"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Session } from "next-auth";
import { CheckCircle2, Send, CalendarDays, Tag, AlertCircle, TrendingDown } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { easeOut } from "@/components/motion/MotionConfig";
import { sortByDesc } from "@/lib/sortOrder";

interface Props { session: Session }

interface LeaveBalance {
  yearlyUsed: number;
  yearlyLimit: number;
  yearlyRemaining: number;
  monthlyUsed: number;
  monthlyLimit: number;
  monthlyRemaining: number;
  monthlyBreakdown: { month: string; used: number; remaining: number }[];
}

const LEAVE_TYPES = [
  "Medical / Health",
  "Family Function",
  "Personal Work",
  "Bereavement",
  "Academic Event",
  "Other",
];

export default function MyLeavesClient({ session }: Props) {
  const toast = useToast();
  const user = session.user as any;

  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [myLeaveBalance, setMyLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loadingML, setLoadingML] = useState(true);
  const [loadingLB, setLoadingLB] = useState(true);

  const [form, setForm] = useState({ type: "", from: "", to: "", reason: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/staff/leave")
      .then(r => r.json()).then(d => {
        setMyLeaves(Array.isArray(d) ? sortByDesc(d, (l) => l.submittedAt) : []);
        setLoadingML(false);
      })
      .catch(() => setLoadingML(false));

    fetch("/api/staff/leave/balance")
      .then(r => r.json()).then(d => { setMyLeaveBalance(d); setLoadingLB(false); })
      .catch(() => setLoadingLB(false));
  }, []);

  // Refresh leave data when the tab becomes visible again (e.g. HOD approved in another tab)
  useEffect(() => {
    const refreshData = () => {
      fetch("/api/staff/leave")
        .then(r => r.json()).then(d => {
          if (Array.isArray(d)) setMyLeaves(sortByDesc(d, (l) => l.submittedAt));
        })
        .catch(() => {});
      fetch("/api/staff/leave/balance")
        .then(r => r.json()).then(d => { setMyLeaveBalance(d); })
        .catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshData();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Also poll every 30 seconds so the HOD's own dashboard reflects changes too
    const interval = setInterval(refreshData, 30000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.type) e.type = "Please select a leave type";
    if (!form.from) e.from = "Start date is required";
    if (!form.to) e.to = "End date is required";
    if (!form.reason) e.reason = "Please provide a reason";
    if (form.from && form.to && form.from > form.to)
      e.to = "End date must be after start date";
    return e;
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setSubmitting(true);

    const res = await fetch("/api/staff/leave/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      setMyLeaves(prev => [data, ...prev]);
      setForm({ type: "", from: "", to: "", reason: "" });
      setSubmitted(true);
      
      // Refresh leave balance after successful submission
      try {
        const balanceRes = await fetch("/api/staff/leave/balance");
        if (balanceRes.ok) {
          const newBalance = await balanceRes.json();
          setMyLeaveBalance(newBalance);
        }
      } catch (error) {
        console.error("Error refreshing leave balance:", error);
      }
      
      toast.success("Leave request submitted", "Awaiting HOD approval.");
      setTimeout(() => setSubmitted(false), 3000);
    } else if (res.status === 422 && data.errors) {
      setFormErrors(data.errors);
    } else {
      toast.error("Submission failed", data.error ?? "Please try again.");
    }
  };

  const myPendingLeaves = myLeaves.filter(l => l.status === "PENDING");

  return (
    <div className="space-y-5">
      {/* Remaining Leave Balance Card */}
      <Card title="Remaining Leave" subtitle="Your leave balance for this year" delay={0.05}>
        {loadingLB ? (
          <div className="space-y-4">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : myLeaveBalance ? (
          <div className="space-y-5">
            {/* Current Month & Yearly Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Current Month */}
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">This Month</p>
                  <CalendarDays size={14} className="text-amber-500" />
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold text-amber-700">{myLeaveBalance.monthlyRemaining}</p>
                  <p className="text-sm text-amber-600">/ {myLeaveBalance.monthlyLimit} days</p>
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  {myLeaveBalance.monthlyUsed} day{myLeaveBalance.monthlyUsed !== 1 ? "s" : ""} used
                </p>
                {/* Progress bar */}
                <div className="mt-3 h-2 rounded-full bg-amber-200 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${(myLeaveBalance.monthlyUsed / myLeaveBalance.monthlyLimit) * 100}%` }}
                  />
                </div>
              </div>

              {/* Yearly Total */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">This Year</p>
                  <TrendingDown size={14} className="text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold text-emerald-700">{myLeaveBalance.yearlyRemaining}</p>
                  <p className="text-sm text-emerald-600">/ {myLeaveBalance.yearlyLimit} days</p>
                </div>
                <p className="text-xs text-emerald-600 mt-2">
                  {myLeaveBalance.yearlyUsed} day{myLeaveBalance.yearlyUsed !== 1 ? "s" : ""} used
                </p>
                {/* Progress bar */}
                <div className="mt-3 h-2 rounded-full bg-emerald-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(myLeaveBalance.yearlyUsed / myLeaveBalance.yearlyLimit) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Monthly Breakdown */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Monthly Breakdown</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {myLeaveBalance.monthlyBreakdown && myLeaveBalance.monthlyBreakdown.length > 0 ? (
                  myLeaveBalance.monthlyBreakdown.map((m, idx) => {
                    const currentMonthIdx = new Date().getMonth();
                    const isCurrentMonth = currentMonthIdx === idx;
                    const isFutureMonth = idx > currentMonthIdx;
                    const usagePercent = (m.used / myLeaveBalance.monthlyLimit) * 100;
                    // Only show warning colors for current/past months
                    const textColor = isFutureMonth
                      ? "text-gray-400"
                      : m.remaining === 0
                      ? "text-red-600"
                      : m.remaining === 1
                      ? "text-amber-600"
                      : "text-emerald-600";
                    const barColor = isFutureMonth
                      ? "bg-gray-300"
                      : m.remaining === 0
                      ? "bg-red-400"
                      : m.remaining === 1
                      ? "bg-amber-400"
                      : "bg-emerald-400";
                    return (
                      <motion.div
                        key={m.month}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...easeOut, delay: idx * 0.03 }}
                        className={`rounded-lg border p-2.5 text-center transition-all ${
                          isCurrentMonth
                            ? "border-primary bg-primary-50"
                            : "border-gray-100 bg-gray-50 hover:border-gray-200"
                        }`}
                      >
                        <p className="text-[10px] font-semibold text-gray-400 uppercase">{m.month}</p>
                        <p className={`text-sm font-bold mt-1 ${textColor}`}>
                          {m.remaining}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5">of {myLeaveBalance.monthlyLimit}</p>
                        {/* Mini progress bar */}
                        <div className="mt-1.5 h-1 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${barColor}`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 col-span-full text-center py-2">No monthly data available</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">Unable to load leave balance</p>
        )}
      </Card>

      {/* Submit form */}
      <Card title="Request Leave" subtitle="Submit a leave request — approved by HOD" delay={0.1}>
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 text-center"
            >
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <CheckCircle2 size={24} className="text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-[#444]">Request Submitted!</p>
              <p className="text-xs text-gray-400 mt-1">Awaiting HOD approval.</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmitLeave}
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {formErrors.submit && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  <AlertCircle size={15} className="shrink-0" />
                  {formErrors.submit}
                </div>
              )}

              {/* Leave type */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#444]">Leave Type *</label>
                <div className="relative">
                  <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className={`w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-[#444] appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${formErrors.type ? "border-red-300" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <option value="">Select leave type...</option>
                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {formErrors.type && <p className="text-xs text-red-500">{formErrors.type}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="From Date *" type="date" value={form.from}
                  onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
                  error={formErrors.from} icon={<CalendarDays size={14} />} />
                <Input label="To Date *" type="date" value={form.to}
                  onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                  error={formErrors.to} icon={<CalendarDays size={14} />} />
              </div>

              <Textarea label="Reason *" placeholder="Briefly describe the reason for your leave..."
                rows={3} value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                error={formErrors.reason} />

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-gray-400">Requests are reviewed by HOD</p>
                <Button type="submit" loading={submitting} icon={<Send size={14} />}>
                  Submit Request
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>

      {/* My leave history */}
      <Card title="My Leave History" subtitle="All your submitted requests" noPadding delay={0.2}>
        {loadingML ? <SkeletonTable rows={3} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Type", "From", "To", "Days", "Reason", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myLeaves.map((lr, i) => {
                  const days = Math.ceil((new Date(lr.toDate).getTime() - new Date(lr.fromDate).getTime()) / 86400000) + 1;
                  return (
                    <motion.tr
                      key={lr.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...easeOut, delay: i * 0.05 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{lr.leaveType}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(lr.fromDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(lr.toDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-400">{days}d</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{lr.reason}</td>
                      <td className="px-4 py-3">
                        <Badge variant={lr.status === "APPROVED" ? "success" : lr.status === "REJECTED" ? "danger" : "warning"} dot>
                          {lr.status.charAt(0) + lr.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                    </motion.tr>
                  );
                })}
                {myLeaves.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No leave requests submitted yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
