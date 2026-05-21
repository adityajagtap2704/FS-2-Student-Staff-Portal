"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, AlertCircle, CheckCircle2, TrendingDown } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { staggerContainer, staggerItem, easeOut } from "@/components/motion/MotionConfig";

interface LeaveBalance {
  yearlyUsed: number;
  yearlyLimit: number;
  yearlyRemaining: number;
  monthlyUsed: number;
  monthlyLimit: number;
  monthlyRemaining: number;
  monthlyBreakdown: Array<{
    month: string;
    used: number;
    remaining: number;
  }>;
}

export default function LeaveBalanceClient() {
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const { error: showError } = useToast();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/staff/leave/balance");

        if (!response.ok) {
          throw new Error("Failed to fetch leave balance");
        }

        const data = await response.json();
        setBalance(data);
      } catch (err) {
        console.error("Error fetching leave balance:", err);
        showError("Failed to load leave balance");
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [showError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-500">Loading leave balance...</p>
        </div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <p className="text-sm text-gray-500">Failed to load leave balance</p>
        </div>
      </div>
    );
  }

  // Calculate percentages
  const yearlyUsedPercent = (balance.yearlyUsed / balance.yearlyLimit) * 100;
  const monthlyUsedPercent = (balance.monthlyUsed / balance.monthlyLimit) * 100;

  // Get status color based on remaining days
  const getStatusColor = (remaining: number) => {
    if (remaining <= 0) return "text-red-600";
    if (remaining <= 2) return "text-amber-600";
    return "text-emerald-600";
  };

  const getStatusBg = (remaining: number) => {
    if (remaining <= 0) return "bg-red-50";
    if (remaining <= 2) return "bg-amber-50";
    return "bg-emerald-50";
  };

  return (
    <div className="space-y-5">
      {/* Yearly Overview */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#444]">Yearly Leave Balance</h3>
            <p className="text-sm text-gray-500 mt-1">Academic Year 2025-2026</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Calendar size={20} className="text-blue-600" />
          </div>
        </div>

        <div className="space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Used</span>
              <span className="text-sm font-semibold text-gray-700">
                {balance.yearlyUsed} / {balance.yearlyLimit} days
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(yearlyUsedPercent, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-gray-600 font-medium">Used</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{balance.yearlyUsed}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-xs text-gray-600 font-medium">Remaining</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{balance.yearlyRemaining}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-gray-700 mt-1">{balance.yearlyLimit}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Monthly Overview */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#444]">Current Month Balance</h3>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <TrendingDown size={20} className="text-amber-600" />
          </div>
        </div>

        <div className="space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Used</span>
              <span className="text-sm font-semibold text-gray-700">
                {balance.monthlyUsed} / {balance.monthlyLimit} days
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(monthlyUsedPercent, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs text-gray-600 font-medium">Used</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{balance.monthlyUsed}</p>
            </div>
            <div className={`${getStatusBg(balance.monthlyRemaining)} rounded-xl p-3`}>
              <p className="text-xs text-gray-600 font-medium">Remaining</p>
              <p className={`text-2xl font-bold mt-1 ${getStatusColor(balance.monthlyRemaining)}`}>
                {balance.monthlyRemaining}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-gray-700 mt-1">{balance.monthlyLimit}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Monthly Breakdown */}
      <Card title="Monthly Breakdown" subtitle="Leave usage for each month" delay={0.2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {balance.monthlyBreakdown.map((month, index) => (
            <motion.div
              key={month.month}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...easeOut, delay: 0.25 + index * 0.03 }}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-card transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700">{month.month}</h4>
                <Badge
                  variant={month.remaining > 0 ? "success" : "danger"}
                  dot
                >
                  {month.remaining > 0 ? "Available" : "Exhausted"}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Used</span>
                  <span className="font-semibold text-gray-700">{month.used} days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Remaining</span>
                  <span className={`font-semibold ${getStatusColor(month.remaining)}`}>
                    {month.remaining} days
                  </span>
                </div>

                {/* Mini progress bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((month.used / 2) * 100, 100)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0.3 }}
        className="bg-blue-50 border border-blue-200 rounded-2xl p-4"
      >
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Leave Balance Information</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Your leave balance is calculated based on approved leave requests. Monthly limits reset each month. Contact HOD for any discrepancies.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
