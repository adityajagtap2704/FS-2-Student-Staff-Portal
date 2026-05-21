"use client";

import { motion } from "framer-motion";
import { staggerItem, easeOut } from "@/components/motion/MotionConfig";
import Badge from "./Badge";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "primary" | "purple";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: { value: string; up: boolean };
  className?: string;
  delay?: number;
}

export default function StatCard({
  label,
  value,
  sub,
  badge,
  badgeVariant = "neutral",
  icon,
  iconBg = "bg-primary-50",
  trend,
  className = "",
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      initial="initial"
      animate="animate"
      transition={{ ...easeOut, delay }}
      whileHover={{ y: -3, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}
      className={`
        group bg-white rounded-2xl border border-gray-100 shadow-card p-6
        cursor-default
        ${className}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <motion.div
            className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {icon}
          </motion.div>
        )}
        {badge && (
          <Badge variant={badgeVariant} dot>
            {badge}
          </Badge>
        )}
      </div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <motion.p
        className="mt-1 text-2xl font-bold text-[#444] tracking-tight"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: delay + 0.1 }}
      >
        {value}
      </motion.p>
      {(sub || trend) && (
        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ${trend.up ? "text-emerald-600" : "text-red-500"}`}>
              <svg className={`h-3 w-3 ${trend.up ? "" : "rotate-180"}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {trend.value}
            </span>
          )}
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      )}
    </motion.div>
  );
}
