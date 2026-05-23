"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Session } from "next-auth";
import { Users, Clock, CheckCircle2 } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { staggerContainer, easeOut } from "@/components/motion/MotionConfig";

interface Props { session: Session }

export default function StaffClient({ session }: Props) {
  const user = session.user as any;

  const [students, setStudents] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [loadingS, setLoadingS] = useState(true);
  const [loadingL, setLoadingL] = useState(true);
  const [loadingML, setLoadingML] = useState(true);

  useEffect(() => {
    fetch("/api/staff/students")
      .then(r => r.json()).then(d => { setStudents(Array.isArray(d) ? d : []); setLoadingS(false); })
      .catch(() => setLoadingS(false));

    fetch("/api/staff/leave")
      .then(r => r.json()).then(d => { setLeaves(Array.isArray(d) ? d : []); setLoadingL(false); })
      .catch(() => setLoadingL(false));

    fetch("/api/staff/leave/request")
      .then(r => r.json()).then(d => { setMyLeaves(Array.isArray(d) ? d : []); setLoadingML(false); })
      .catch(() => setLoadingML(false));
  }, []);

  const pendingLeaves = leaves.filter(l => l.status === "PENDING");
  const myPendingLeaves = myLeaves.filter(l => l.status === "PENDING");

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={easeOut}>
        <h1 className="text-2xl font-bold text-[#444] tracking-tight">Staff Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">
          Managing <span className="font-semibold text-primary">{user.assignedClass}</span> · {students.length} students
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" variants={staggerContainer} initial="initial" animate="animate">
        <StatCard label="My Students" value={loadingS ? "—" : students.length.toString()} sub={user.assignedClass}
          icon={<Users size={18} className="text-primary" />} iconBg="bg-primary-50" delay={0.05} />
        <StatCard label="Pending Leaves" value={loadingL ? "—" : pendingLeaves.length.toString()} sub="Students awaiting action"
          icon={<Clock size={18} className="text-amber-500" />} iconBg="bg-amber-50"
          badge={pendingLeaves.length > 0 ? "Action needed" : "All clear"}
          badgeVariant={pendingLeaves.length > 0 ? "warning" : "success"} delay={0.1} />
        <StatCard label="My Leave" value={loadingML ? "—" : myPendingLeaves.length.toString()} sub="My pending requests"
          icon={<CheckCircle2 size={18} className="text-emerald-600" />} iconBg="bg-emerald-50"
          badge={myPendingLeaves.length > 0 ? "Pending HOD" : "All clear"}
          badgeVariant={myPendingLeaves.length > 0 ? "warning" : "success"} delay={0.15} />
      </motion.div>
    </div>
  );
}
