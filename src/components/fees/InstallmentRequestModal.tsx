"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface InstallmentRequestModalProps {
  feeId: number;
  feeAmount: number;
  feeTerm: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InstallmentRequestModal({
  feeId,
  feeAmount,
  feeTerm,
  isOpen,
  onClose,
  onSuccess,
}: InstallmentRequestModalProps) {
  const { success, error } = useToast();
  const FIRST_INSTALLMENT = 5000;
  const remainingBalance = feeAmount - FIRST_INSTALLMENT;
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasExistingInstallment, setHasExistingInstallment] = useState(false);
  const [checkingInstallment, setCheckingInstallment] = useState(false);

  // Check if student already has an approved installment for this term
  useEffect(() => {
    if (!isOpen) return;

    const checkExistingInstallment = async () => {
      try {
        setCheckingInstallment(true);
        const res = await fetch("/api/installments/request");
        if (res.ok) {
          const data = await res.json();
          const requests = Array.isArray(data.requests) ? data.requests : [];
          
          // Check if there's an approved installment for this term
          const existingForTerm = requests.some(
            (req: any) => req.fee?.term === feeTerm && req.status === "APPROVED"
          );
          
          setHasExistingInstallment(existingForTerm);
        }
      } catch (err) {
        console.error("Error checking installment:", err);
      } finally {
        setCheckingInstallment(false);
      }
    };

    checkExistingInstallment();
  }, [isOpen, feeTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      error("Please provide a reason for requesting installment");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/installments/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeId,
          numberOfInstallments: 1,
          reason,
          firstInstallmentAmount: FIRST_INSTALLMENT,
          remainingBalance: remainingBalance,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      success("Request submitted", "Your installment request has been submitted for approval");
      setReason("");
      onSuccess();
      onClose();
    } catch (err: any) {
      error("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Request Installment Plan</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Fee Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">Fee Details</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{feeTerm}</p>
          <p className="text-sm text-gray-600 mt-1">Amount: ₹{feeAmount.toLocaleString()}</p>
        </div>

        {/* Existing Installment Warning */}
        {hasExistingInstallment && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-6">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">
              You already have an approved installment plan for {feeTerm}. Only one installment plan is allowed per term.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" style={{ opacity: hasExistingInstallment ? 0.5 : 1 }}>
          {/* Installment Details - Fixed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Plan
            </label>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
              {/* First Installment */}
              <div className="pb-3 border-b border-emerald-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">1st Installment (Now):</span>
                  <span className="text-lg font-bold text-emerald-700">₹{FIRST_INSTALLMENT.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500">Pay immediately</p>
              </div>
              
              {/* Remaining Balance */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Remaining Balance:</span>
                  <span className="text-lg font-bold text-amber-600">₹{remainingBalance.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500">Pay later (after approval)</p>
              </div>

              {/* Total */}
              <div className="pt-2 border-t border-emerald-200 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-800">Total Fee:</span>
                <span className="text-lg font-bold text-gray-900">₹{feeAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Installment Request
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={hasExistingInstallment || checkingInstallment}
              placeholder="Explain your financial situation (e.g., medical expenses, job loss, etc.)"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Info */}
          <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Your request will be reviewed. If approved, you&apos;ll receive installment details via email.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading || checkingInstallment}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading || checkingInstallment}
              disabled={hasExistingInstallment || checkingInstallment}
              className="flex-1"
            >
              {checkingInstallment ? "Checking..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
