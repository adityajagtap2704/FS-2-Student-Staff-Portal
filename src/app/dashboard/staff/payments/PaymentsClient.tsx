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

export default function PaymentsClient({ session }: Props) {
  const user = session.user as any;

  const [payments, setPayments] = useState<any[]>([]);
  const [loadingP, setLoadingP] = useState(true);

  useEffect(() => {
    fetch("/api/payments?limit=50")
      .then(r => r.json())
      .then(d => { setPayments(Array.isArray(d?.payments) ? d.payments : []); setLoadingP(false); })
      .catch(() => setLoadingP(false));
  }, []);

  const totalAmount = payments.reduce((sum, p) => sum + (Number(p.amountPaise) || 0), 0);
  const paidCount = payments.filter(p => p.status === "PAID").length;
  const failedCount = payments.filter(p => p.status === "FAILED").length;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={easeOut}>
        <h1 className="text-2xl font-bold text-[#444] tracking-tight">Recent Payments</h1>
        <p className="mt-1 text-sm text-gray-400">
          Latest transactions for <span className="font-semibold text-primary">{user.assignedClass}</span>
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" variants={staggerContainer} initial="initial" animate="animate">
        <StatCard label="Total Amount" value={`₹${(totalAmount / 100).toLocaleString("en-IN")}`} sub="All transactions"
          icon={<CreditCard size={18} className="text-primary" />} iconBg="bg-primary-50" delay={0.05} />
        <StatCard label="Successful" value={paidCount.toString()} sub="Completed payments"
          icon={<CreditCard size={18} className="text-emerald-600" />} iconBg="bg-emerald-50" delay={0.1} />
        <StatCard label="Failed" value={failedCount.toString()} sub="Failed transactions"
          icon={<CreditCard size={18} className="text-red-500" />} iconBg="bg-red-50" delay={0.15} />
      </motion.div>

      {/* Payments Table */}
      <Card title="Recent Payments" subtitle={`Latest transactions for ${user.assignedClass}`} noPadding delay={0.2}>
        {loadingP ? <SkeletonTable rows={4} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Student", "Term", "Amount", "Status", "Receipt", "Updated"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p: any) => (
                  <tr key={`${p.razorpayOrderId}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#444] whitespace-nowrap">{p.studentName ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.term ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">₹{((Number(p.amountPaise) || 0) / 100).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === "PAID" ? "success" : p.status === "FAILED" ? "danger" : "neutral"} dot>
                        {String(p.status).toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.receiptNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No payments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
