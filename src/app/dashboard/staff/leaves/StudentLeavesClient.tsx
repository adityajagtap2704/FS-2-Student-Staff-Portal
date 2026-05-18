"use client";

import { useEffect, useState } from "react";
import { Session } from "next-auth";
import { Clock } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { staggerContainer, easeOut } from "@/components/motion/MotionConfig";
import { motion } from "framer-motion";

interface Props { session: Session }

export default function StudentLeavesClient({ session }: Props) {
  const toast = useToast();
  const user = session.user as any;

  const [leaves, setLeaves] = useState<any[]>([]);
  const [loadingL, setLoadingL] = useState(true);
  const [leaveFilter, setLeaveFilter] = useState<"PENDING" | "ALL" | "APPROVED" | "REJECTED">("PENDING");

  useEffect(() => {
    fetch("/api/staff/student-leaves")
      .then(r => r.json()).then(d => { setLeaves(Array.isArray(d) ? d : []); setLoadingL(false); })
      .catch(() => setLoadingL(false));
  }, []);

  const handleLeaveAction = async (id: number, status: "APPROVED" | "REJECTED") => {
    const res = await fetch(`/api/leave/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      toast.success(`Leave ${status.toLowerCase()}`, "Student has been notified.");
    } else {
      toast.error("Action failed", "Please try again.");
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === "PENDING");

  const leaveColor = (balance: any) => {
    if (!balance) return "text-gray-400";
    if (balance.monthlyRemaining === 0) return "text-red-500";
    if (balance.monthlyRemaining === 1) return "text-amber-500";
    return "text-emerald-500";
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={easeOut}>
        <h1 className="text-2xl font-bold text-[#444] tracking-tight">Student Leave Requests</h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage <span className="font-semibold text-primary">{user.assignedClass}</span> leave requests
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" variants={staggerContainer} initial="initial" animate="animate">
        <StatCard label="Pending Leaves" value={pendingLeaves.length.toString()} sub="Students awaiting action"
          icon={<Clock size={18} className="text-amber-500" />} iconBg="bg-amber-50"
          badge={pendingLeaves.length > 0 ? "Action needed" : "All clear"}
          badgeVariant={pendingLeaves.length > 0 ? "warning" : "success"} delay={0.05} />
        <StatCard label="Total Requests" value={leaves.length.toString()} sub="All leave requests"
          icon={<Clock size={18} className="text-primary" />} iconBg="bg-primary-50" delay={0.1} />
      </motion.div>

      {/* Filter bar */}
      <Card title="Student Leave Requests" subtitle="Manage your class's leave requests" noPadding delay={0.2}>
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 flex-wrap">
          {(["PENDING", "ALL", "APPROVED", "REJECTED"] as const).map(f => (
            <button
              key={f}
              onClick={() => setLeaveFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                leaveFilter === f ? "bg-primary text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {f}
              {f === "PENDING" && pendingLeaves.length > 0 && (
                <span className="ml-1.5 bg-amber-400 text-white text-[9px] font-bold px-1 py-0.5 rounded-full">{pendingLeaves.length}</span>
              )}
              {f !== "PENDING" && (
                <span className="ml-1 opacity-60">({f === "ALL" ? leaves.length : leaves.filter(l => l.status === f).length})</span>
              )}
            </button>
          ))}
        </div>

        {loadingL ? <SkeletonTable rows={4} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Student", "Type", "From", "To", "Days", "Monthly Left", "Yearly Left", "Status", "Action"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(leaveFilter === "ALL" ? leaves : leaves.filter(l => l.status === leaveFilter)).map(lr => {
                  const days = Math.ceil((new Date(lr.toDate).getTime() - new Date(lr.fromDate).getTime()) / 86400000) + 1;
                  return (
                    <tr key={lr.id} className={`hover:bg-gray-50/50 transition-colors ${lr.status === "PENDING" ? "bg-amber-50/30" : ""}`}>
                      <td className="px-4 py-3 font-medium text-[#444] whitespace-nowrap">{lr.student?.name}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{lr.leaveType}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(lr.fromDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(lr.toDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-400">{days}d</td>
                      <td className={`px-4 py-3 font-semibold ${leaveColor(lr.leaveBalance)}`}>
                        {lr.leaveBalance?.monthlyRemaining ?? "—"}/{lr.leaveBalance?.monthlyLimit ?? 2}
                      </td>
                      <td className={`px-4 py-3 font-semibold ${(lr.leaveBalance?.yearlyRemaining ?? 10) <= 2 ? "text-red-500" : (lr.leaveBalance?.yearlyRemaining ?? 10) <= 5 ? "text-amber-500" : "text-emerald-500"}`}>
                        {lr.leaveBalance?.yearlyRemaining ?? "—"}/{lr.leaveBalance?.yearlyLimit ?? 10}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={lr.status === "APPROVED" ? "success" : lr.status === "REJECTED" ? "danger" : "warning"} dot>
                          {lr.status.charAt(0) + lr.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {lr.status === "PENDING" ? (
                          <div className="flex items-center gap-1.5">
                            <Button size="xs" variant="secondary" onClick={() => handleLeaveAction(lr.id, "APPROVED")}>Approve</Button>
                            <Button size="xs" variant="danger" onClick={() => handleLeaveAction(lr.id, "REJECTED")}>Reject</Button>
                          </div>
                        ) : <span className="text-xs text-gray-300">Done</span>}
                      </td>
                    </tr>
                  );
                })}
                {leaves.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No leave requests found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
