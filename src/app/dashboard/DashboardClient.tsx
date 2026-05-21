"use client";

import { motion } from "framer-motion";
import { Session } from "next-auth";
import Link from "next/link";
import { CreditCard, CalendarOff, Megaphone, ArrowRight, TrendingUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { StaggerList, StaggerItem } from "@/components/motion/StaggerList";
import { staggerContainer, staggerItem, easeOut } from "@/components/motion/MotionConfig";

const iconMap = {
  check:    CheckCircle2,
  clock:    Clock,
  megaphone:Megaphone,
  alert:    AlertCircle,
  credit:   CreditCard,
  calendar: CalendarOff,
};

interface Props {
  session: Session;
  greeting: string;
  activity: {
    icon: string; iconColor: string; iconBg: string;
    title: string; sub: string; time: string;
    badge: "success"|"warning"|"info"|"danger"; badgeLabel: string;
  }[];
  quickLinks: { href: string; label: string; icon: string; color: string; bg: string }[];
  stats: {
    totalFees: string;
    paid: string;
    outstanding: string;
    paidPercent: number;
    termCount: number;
    academicYear: number;
  };
}

export default function DashboardClient({ session, greeting, activity, quickLinks, stats }: Props) {
  return (
    <div className="space-y-5">
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-primary p-6 text-white shadow-glow-lg"
      >
        <div className="absolute inset-0 bg-mesh-pattern opacity-30" />
        <div className="relative">
          <p className="text-sm text-white/70 font-medium">{greeting} 👋</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {session.user?.name?.split(" ")[0] ?? "Student"}
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Here&apos;s what&apos;s happening with your account today.
          </p>
        </div>
        <motion.div
          className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <TrendingUp size={80} />
        </motion.div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <StatCard label="Total Fees" value={stats.totalFees} sub={`Academic year ${stats.academicYear}`}
          icon={<CreditCard size={18} className="text-primary" />} iconBg="bg-primary-50"
          badge={`${stats.termCount} Records`} badgeVariant="primary" delay={0.05} />
        <StatCard label="Paid" value={stats.paid} sub="Paid to date"
          icon={<CheckCircle2 size={18} className="text-emerald-600" />} iconBg="bg-emerald-50"
          badge="On time" badgeVariant="success" trend={{ value: `${stats.paidPercent}%`, up: true }} delay={0.1} />
        <StatCard label="Outstanding" value={stats.outstanding} sub="Pending dues"
          icon={<AlertCircle size={18} className="text-red-500" />} iconBg="bg-red-50"
          badge={stats.outstanding !== "₹0" ? "Due soon" : "Cleared"} badgeVariant={stats.outstanding !== "₹0" ? "danger" : "success"} delay={0.15} />
      </motion.div>

      {/* Quick actions */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {quickLinks.map(({ href, label, icon, color, bg }, i) => {
          const Icon = iconMap[icon as keyof typeof iconMap];
          return (
            <motion.div key={href} variants={staggerItem} transition={{ ...easeOut, delay: i * 0.05 }}>
              <Link href={href}>
                <motion.div
                  className="group flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-card cursor-pointer"
                  whileHover={{ y: -3, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <motion.div
                    className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Icon size={18} className={color} />
                  </motion.div>
                  <span className="text-xs font-medium text-gray-600 text-center leading-tight">{label}</span>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recent activity */}
      <Card
        title="Recent Activity"
        subtitle="Your latest account events"
        delay={0.2}
        action={
          <Link href="/dashboard/fees" className="text-xs text-primary hover:text-primary-600 font-medium flex items-center gap-1 transition-colors">
            View all <ArrowRight size={12} />
          </Link>
        }
      >
        <ul className="space-y-1 -mx-2">
          {activity.map((item, i) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...easeOut, delay: 0.25 + i * 0.06 }}
                whileHover={{ x: 3, backgroundColor: "rgba(249,250,251,1)" }}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors cursor-default"
              >
                <motion.div
                  className={`h-8 w-8 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Icon size={15} className={item.iconColor} />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#444] truncate">{item.title}</p>
                  <p className="text-xs text-gray-400 truncate">{item.sub}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={item.badge} dot>{item.badgeLabel}</Badge>
                  <span className="text-[10px] text-gray-300">{item.time}</span>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
