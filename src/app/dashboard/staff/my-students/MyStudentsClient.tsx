"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Session } from "next-auth";
import { Users } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import { staggerContainer, easeOut } from "@/components/motion/MotionConfig";

interface Props {
  session: Session;
}

export default function MyStudentsClient({ session }: Props) {
  const user = session.user as any;
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/staff/students")
      .then(r => r.json())
      .then(d => {
        setStudents(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const leaveColor = (balance: any) => {
    if (!balance) return "text-gray-400";
    if (balance.monthlyRemaining === 0) return "text-red-500";
    if (balance.monthlyRemaining === 1) return "text-amber-500";
    return "text-emerald-500";
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={easeOut}>
        <h1 className="text-2xl font-bold text-[#444] tracking-tight">My Students</h1>
        <p className="mt-1 text-sm text-gray-400">
          Managing <span className="font-semibold text-primary">{user.assignedClass}</span>
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <StatCard
          label="Total Students"
          value={loading ? "—" : students.length.toString()}
          sub={user.assignedClass}
          icon={<Users size={18} className="text-primary" />}
          iconBg="bg-primary-50"
          delay={0.05}
        />
        <StatCard
          label="Active"
          value={loading ? "—" : students.filter(s => s.isActive).length.toString()}
          sub="Currently enrolled"
          icon={<Users size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          delay={0.1}
        />
        <StatCard
          label="Inactive"
          value={loading ? "—" : students.filter(s => !s.isActive).length.toString()}
          sub="Not currently enrolled"
          icon={<Users size={18} className="text-gray-400" />}
          iconBg="bg-gray-50"
          delay={0.15}
        />
      </motion.div>

      {/* Students Table */}
      <Card title="Student List" subtitle={`${students.length} students in ${user.assignedClass}`} noPadding delay={0.2}>
        {loading ? (
          <SkeletonTable rows={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Name", "Roll No.", "Parent", "Phone", "Monthly Left", "Yearly Left", "Status"].map(h => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#444]">{s.name}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{s.rollNumber}</td>
                    <td className="px-4 py-3 text-gray-500">{s.parentName}</td>
                    <td className="px-4 py-3 text-gray-400">{s.phone}</td>
                    <td className={`px-4 py-3 font-semibold ${leaveColor(s.leaveBalance)}`}>
                      {s.leaveBalance?.monthlyRemaining ?? "—"}/{s.leaveBalance?.monthlyLimit ?? 2}
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        (s.leaveBalance?.yearlyRemaining ?? 10) <= 2
                          ? "text-red-500"
                          : (s.leaveBalance?.yearlyRemaining ?? 10) <= 5
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {s.leaveBalance?.yearlyRemaining ?? "—"}/{s.leaveBalance?.yearlyLimit ?? 10}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.isActive ? "success" : "neutral"} dot>
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
