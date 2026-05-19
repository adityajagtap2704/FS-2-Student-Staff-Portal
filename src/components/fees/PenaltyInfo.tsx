"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Info } from "lucide-react";

interface PenaltyInfoProps {
  penaltyAmount: number;
  penaltyPercentage: number;
  daysOverdue?: number;
  reason?: string;
}

export default function PenaltyInfo({
  penaltyAmount,
  penaltyPercentage,
  daysOverdue,
  reason,
}: PenaltyInfoProps) {
  if (penaltyAmount <= 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 rounded-lg p-4"
    >
      <div className="flex gap-3">
        <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-red-900">Late Payment Penalty Applied</p>
          
          <div className="mt-2 space-y-1">
            <p className="text-sm text-red-700">
              <span className="font-semibold">Penalty Amount:</span> ₹{penaltyAmount.toLocaleString()}
            </p>
            <p className="text-sm text-red-700">
              <span className="font-semibold">Penalty Rate:</span> {penaltyPercentage}%
            </p>
            {daysOverdue && (
              <p className="text-sm text-red-700">
                <span className="font-semibold">Days Overdue:</span> {daysOverdue} days
              </p>
            )}
            {reason && (
              <p className="text-sm text-red-700">
                <span className="font-semibold">Reason:</span> {reason}
              </p>
            )}
          </div>

          <p className="text-xs text-red-600 mt-3">
            You must pay the original fee amount plus this penalty to clear your dues.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
