"use client";

import { motion } from "framer-motion";
<<<<<<< HEAD
import { CheckCircle2, Clock, AlertCircle, XCircle, ArrowUpRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useState } from "react";
=======
import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import Badge from "@/components/ui/Badge";
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d

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
<<<<<<< HEAD
  onPaymentSuccess?: () => void;
=======
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
}

export default function InstallmentStatus({
  installments,
  requestStatus,
<<<<<<< HEAD
  onPaymentSuccess,
}: InstallmentStatusProps) {
  const toast = useToast();
  const [payingId, setPayingId] = useState<number | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":    return <CheckCircle2 size={16} className="text-emerald-600" />;
      case "OVERDUE": return <AlertCircle  size={16} className="text-red-500" />;
      case "PENDING": return <Clock        size={16} className="text-amber-500" />;
      default:        return null;
=======
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
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
<<<<<<< HEAD
      case "PAID":    return <Badge variant="success" dot>Paid</Badge>;
      case "OVERDUE": return <Badge variant="danger"  dot>Overdue</Badge>;
      case "PENDING": return <Badge variant="warning" dot>Pending</Badge>;
      default:        return null;
    }
  };

  const loadRazorpay = async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if ((window as any).Razorpay) return true;
    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload  = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async (installment: Installment) => {
    try {
      setPayingId(installment.id);

      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Payment gateway", "Failed to load Razorpay. Check your internet connection.");
        return;
      }

      // Create Razorpay order for this installment
      const orderRes = await fetch("/api/payments/installment-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installmentId: installment.id }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        toast.error("Payment failed", orderData.error || "Unable to create order");
        return;
      }

      // Open Razorpay checkout
      const rzp = new (window as any).Razorpay({
        key:         orderData.keyId,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        orderData.name,
        description: orderData.description,
        order_id:    orderData.orderId,
        prefill:     orderData.prefill,
        notes:       orderData.notes,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payments/installment-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            toast.error("Verification failed", verifyData.error || "Please contact support");
            return;
          }
          toast.success(
            `Installment ${installment.installmentNumber} paid`,
            "Your payment has been recorded successfully."
          );
          onPaymentSuccess?.();
        },
        modal: {
          ondismiss: () => toast.info("Payment cancelled", "You can retry anytime."),
        },
        theme: { color: "#10b981" },
      });

      rzp.open();
    } catch (err: any) {
      toast.error("Payment failed", err?.message ?? "Please try again.");
    } finally {
      setPayingId(null);
    }
  };

  // ── REJECTED ──────────────────────────────────────────────────────────────
=======
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

>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
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

<<<<<<< HEAD
  // ── PENDING ───────────────────────────────────────────────────────────────
=======
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
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

<<<<<<< HEAD
  // ── APPROVED — show installment schedule with Pay buttons ─────────────────
  // Determine which installment is next to pay (first unpaid one in order)
  const nextPayableIndex = installments.findIndex(i => i.status !== "PAID");

=======
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
<<<<<<< HEAD
      className="space-y-2"
    >
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 size={14} className="text-emerald-600" />
        <p className="text-sm font-semibold text-emerald-700">Installment Plan Approved</p>
      </div>

      {installments.map((installment, index) => {
        const isPaid      = installment.status === "PAID";
        const isPayable   = index === nextPayableIndex; // only the next unpaid one is payable
        const isLocked    = !isPaid && !isPayable;      // future installments locked until previous paid
        const isOverdue   = installment.status === "OVERDUE";

        return (
          <motion.div
            key={installment.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              isPaid    ? "bg-emerald-50 border-emerald-200" :
              isOverdue ? "bg-red-50 border-red-200" :
              isPayable ? "bg-amber-50 border-amber-300" :
                          "bg-gray-50 border-gray-200 opacity-60"
            }`}
          >
            {/* Left — icon + label */}
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon(installment.status)}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Installment {installment.installmentNumber}
                  {isPayable && !isPaid && (
                    <span className="ml-2 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                      Due now
                    </span>
                  )}
                  {isLocked && (
                    <span className="ml-2 text-[10px] text-gray-400">Pay installment {installment.installmentNumber - 1} first</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  Due: {new Date(installment.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Right — amount + badge + pay button */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  ₹{Number(installment.amount).toLocaleString("en-IN")}
                </p>
                {getStatusBadge(installment.status)}
              </div>

              {/* Pay button — only for the next payable installment */}
              {isPayable && (
                <Button
                  size="xs"
                  variant={isOverdue ? "danger" : "primary"}
                  icon={<ArrowUpRight size={12} />}
                  loading={payingId === installment.id}
                  onClick={() => handlePay(installment)}
                >
                  Pay Now
                </Button>
              )}
            </div>
          </motion.div>
        );
      })}
=======
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
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
    </motion.div>
  );
}
