"use client";

import { useEffect, useState } from "react";
import { Session } from "next-auth";
import { CreditCard } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { staggerContainer, easeOut } from "@/components/motion/MotionConfig";
import { motion } from "framer-motion";

interface Props { session: Session }

export default function FeesClient({ session }: Props) {
  const user = session.user as any;

  const [feesByStudent, setFeesByStudent] = useState<any[]>([]);
  const [loadingF, setLoadingF] = useState(true);

  useEffect(() => {
    fetch("/api/staff/fees")
      .then(r => r.json())
      .then(d => { setFeesByStudent(Array.isArray(d?.students) ? d.students : []); setLoadingF(false); })
      .catch(() => setLoadingF(false));
  }, []);

  const totalFees = feesByStudent.reduce((sum, row) => sum + (Number(row.summary?.total) || 0), 0);
  const totalPaid = feesByStudent.reduce((sum, row) => sum + (Number(row.summary?.paid) || 0), 0);
  const totalOutstanding = feesByStudent.reduce((sum, row) => sum + (Number(row.summary?.outstanding) || 0), 0);

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={easeOut}>
        <h1 className="text-2xl font-bold text-[#444] tracking-tight">Fee Status</h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage fees for <span className="font-semibold text-primary">{user.assignedClass}</span>
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" variants={staggerContainer} initial="initial" animate="animate">
        <StatCard label="Total Fees" value={`₹${(totalFees / 100).toLocaleString("en-IN")}`} sub="All students"
          icon={<CreditCard size={18} className="text-primary" />} iconBg="bg-primary-50" delay={0.05} />
        <StatCard label="Paid" value={`₹${(totalPaid / 100).toLocaleString("en-IN")}`} sub="Collected"
          icon={<CreditCard size={18} className="text-emerald-600" />} iconBg="bg-emerald-50" delay={0.1} />
        <StatCard label="Outstanding" value={`₹${(totalOutstanding / 100).toLocaleString("en-IN")}`} sub="Pending"
          icon={<CreditCard size={18} className="text-red-500" />} iconBg="bg-red-50" delay={0.15} />
      </motion.div>

      {/* Fees Table */}
      <Card title="Fee Status" subtitle={`Paid / Pending / Overdue — ${user.assignedClass}`} noPadding delay={0.2}>
        {loadingF ? <SkeletonTable rows={6} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Student", "Roll No.", "Total", "Paid", "Outstanding", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {feesByStudent.map((row: any) => {
                  const s = row.student;
                  const sum = row.summary || {};
                  const hasOverdue = (sum.overdueCount || 0) > 0;
                  const hasPending = (sum.pendingCount || 0) > 0;
                  const variant = hasOverdue ? "danger" : hasPending ? "warning" : "success";
                  const label = hasOverdue ? "Overdue" : hasPending ? "Pending" : "Paid";
                  return (
                    <tr key={s.id} className={`hover:bg-gray-50/50 transition-colors ${hasOverdue ? "bg-red-50/30" : ""}`}>
                      <td className="px-4 py-3 font-medium text-[#444] whitespace-nowrap flex items-center gap-2">
                        <CreditCard size={14} className={hasOverdue ? "text-red-500" : hasPending ? "text-amber-500" : "text-emerald-600"} />
                        {s.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">{s.rollNumber ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500">₹{Number(sum.total ?? 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-gray-500">₹{Number(sum.paid ?? 0).toLocaleString("en-IN")}</td>
                      <td className={`px-4 py-3 font-semibold ${Number(sum.outstanding ?? 0) > 0 ? "text-red-600" : "text-emerald-700"}`}>
                        ₹{Number(sum.outstanding ?? 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={variant as any} dot>
                          {label} {hasPending || hasOverdue ? `(${(sum.pendingCount || 0) + (sum.overdueCount || 0)} due)` : ""}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {feesByStudent.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No fee records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
