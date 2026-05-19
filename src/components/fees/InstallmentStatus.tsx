"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import Badge from "@/components/ui/Badge";

interface Installment {
  id: number;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
  status: "PENDING" | "PAID" | "OVERDUE";
}

interface InstallmentStatusProps {
  installments: Installment[];
  requestStatus: "PENDING" | "APPROVED" | "REJECTED";
}

export default function InstallmentStatus({
  installments,
  requestStatus,
}: InstallmentStatusProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle2 size={16} className="text-emerald-600" />;
      case "OVERDUE":
        return <AlertCircle size={16} className="text-red-500" />;
      case "PENDING":
        return <Clock size={16} className="text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge variant="success" dot>Paid</Badge>;
      case "OVERDUE":
        return <Badge variant="danger" dot>Overdue</Badge>;
      case "PENDING":
        return <Badge variant="warning" dot>Pending</Badge>;
      default:
        return null;
    }
  };

  if (requestStatus === "REJECTED") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 border border-red-200 rounded-lg p-4"
      >
        <div className="flex gap-3">
          <XCircle size={20} className="text-red-600 shrink-0" />
          <div>
            <p className="font-medium text-red-900">Installment Request Rejected</p>
            <p className="text-sm text-red-700 mt-1">
              Your installment request was not approved. Please pay the full fee by the due date.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (requestStatus === "PENDING") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <div className="flex gap-3">
          <Clock size={20} className="text-blue-600 shrink-0" />
          <div>
            <p className="font-medium text-blue-900">Installment Request Pending</p>
            <p className="text-sm text-blue-700 mt-1">
              Your request is under review. You&apos;ll be notified once it&apos;s approved or rejected.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <p className="text-sm font-medium text-gray-700">Installment Schedule</p>
      
      {installments.map((installment, index) => (
        <motion.div
          key={installment.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="flex items-center gap-3 flex-1">
            {getStatusIcon(installment.status)}
            <div>
              <p className="text-sm font-medium text-gray-900">
                Installment {installment.installmentNumber}
              </p>
              <p className="text-xs text-gray-500">
                Due: {new Date(installment.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              ₹{installment.amount.toLocaleString()}
            </p>
            {getStatusBadge(installment.status)}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
