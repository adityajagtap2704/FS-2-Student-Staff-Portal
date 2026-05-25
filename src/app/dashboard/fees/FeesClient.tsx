"use client";

import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, AlertCircle, Clock, Download, ArrowUpRight, FileText } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { staggerContainer, staggerItem, easeOut } from "@/components/motion/MotionConfig";
import { useToast } from "@/components/ui/Toast";
import InstallmentRequestModal from "@/components/fees/InstallmentRequestModal";
import InstallmentStatus from "@/components/fees/InstallmentStatus";
import PenaltyInfo from "@/components/fees/PenaltyInfo";

import { useState, useEffect } from "react";

type FeeRecord = {
  id: number;
  term: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  paidAt: string | null;
  status: "PAID" | "PENDING" | "OVERDUE";
  type?: string;
  penaltyAmount?: number;
  penaltyPercentage?: number;
};

type InstallmentData = {
  request?: {
    id: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    numberOfInstallments: number;
  };
  installments?: Array<{
    id: number;
    installmentNumber: number;
    amount: number;
    dueDate: string;
    paidAmount: number;
    status: "PENDING" | "PAID" | "OVERDUE";
  }>;
};

const statusConfig: Record<string, { variant: "success"|"danger"|"neutral"; label: string }> = {
  PAID:     { variant: "success", label: "Paid"     },
  OVERDUE:  { variant: "danger",  label: "Overdue"  },
  PENDING:  { variant: "neutral", label: "Upcoming" },
};

export default function FeesClient() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ records: FeeRecord[], summary: any } | null>(null);
  const [payingFeeId, setPayingFeeId] = useState<number | null>(null);
  const [installmentData, setInstallmentData] = useState<Record<number, InstallmentData>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFeeForInstallment, setSelectedFeeForInstallment] = useState<FeeRecord | null>(null);

  const reloadFees = async () => {
    try {
      const res = await fetch("/api/fees");
      if (!res.ok) throw new Error(`Failed to fetch fees: ${res.status}`);
      const d = await res.json();
      console.log("Fees reloaded successfully:", d);
      setData(d);
      setLoading(false);
      
      // Fetch installment data for student
      try {
        const installRes = await fetch("/api/installments/request");
        if (installRes.ok) {
          const data = await installRes.json();
          const requests = Array.isArray(data.requests) ? data.requests : [];
          
          // Map requests by feeId
          const installmentMap: Record<number, InstallmentData> = {};
          for (const req of requests) {
            installmentMap[req.feeId] = {
              request: {
                id: req.id,
                status: req.status,
                numberOfInstallments: req.numberOfInstallments,
              },
              installments: req.installments || [],
            };
          }
          setInstallmentData(installmentMap);
        }
      } catch (err) {
        console.error("Error fetching installment data:", err);
      }
    } catch (err) {
      console.error("Error reloading fees:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadFees();
  }, []);

  // Auto-refresh every 5 seconds to catch installment status updates
  useEffect(() => {
    const interval = setInterval(() => {
      reloadFees();
    }, 5000);

    // Also refresh immediately when the tab regains focus
    const onFocus = () => reloadFees();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const loadRazorpay = async () => {
    if (typeof window === "undefined") return false;
    if ((window as any).Razorpay) return true;

    return await new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const downloadReceipt = (feeId: number, installmentId?: number) => {
    try {
      toast.info("Opening receipt...", "Receipt will open in a new tab.");
      const q = installmentId ? `?installmentId=${installmentId}` : "";
      window.open(`/api/fees/${feeId}/receipt${q}`, "_blank");
    } catch (e: any) {
      toast.error("Receipt", e?.message ?? "Failed to open receipt");
    }
  };

  const startPayment = async (feeId: number) => {
    try {
      setPayingFeeId(feeId);
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Payment gateway", "Failed to load Razorpay. Check your internet connection.");
        return;
      }

      const orderRes = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData?.error || "Unable to create order");

      const rzp = new (window as any).Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.name,
        description: orderData.description,
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        notes: orderData.notes,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(verifyData?.error || "Payment verification failed");

          toast.success("Payment successful", "Your fee status has been updated.");
          await reloadFees();
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled", "You can retry anytime.");
          },
        },
        theme: { color: "#16a34a" },
      });

      rzp.open();
    } catch (e: any) {
      toast.error("Payment failed", e?.message ?? "Please try again.");
    } finally {
      setPayingFeeId(null);
    }
  };

  const payOutstanding = async () => {
    try {
      if (!data || data.summary.outstanding <= 0) {
        toast.info("No outstanding", "All fees are paid.");
        return;
      }

      setPayingFeeId(-1); // Use -1 to indicate outstanding payment
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Payment gateway", "Failed to load Razorpay. Check your internet connection.");
        return;
      }

      const orderRes = await fetch("/api/payments/outstanding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: data.summary.outstanding,
          reason: "Outstanding Balance Payment",
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData?.error || "Unable to create order");

      const rzp = new (window as any).Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.name,
        description: orderData.description,
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        notes: orderData.notes,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(verifyData?.error || "Payment verification failed");

          toast.success("Payment successful", "Your outstanding balance has been cleared.");
          await reloadFees();
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled", "You can retry anytime.");
          },
        },
        theme: { color: "#16a34a" },
      });

      rzp.open();
    } catch (e: any) {
      toast.error("Payment failed", e?.message ?? "Please try again.");
    } finally {
      setPayingFeeId(null);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Loading your fee details...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">Failed to load fee information.</div>;

  let { records, summary } = data;

  // Deduplicate Outstanding fees with same due date (merge them)
  const deduplicatedRecords: FeeRecord[] = [];
  const outstandingMap = new Map<string, FeeRecord>();

  for (const record of records) {
    if (record.type === "Outstanding") {
      const key = new Date(record.dueDate).toISOString().split('T')[0]; // Group by date
      if (outstandingMap.has(key)) {
        // Merge with existing outstanding fee
        const existing = outstandingMap.get(key)!;
        existing.amount = Number(existing.amount) + Number(record.amount);
        existing.paidAmount = Number(existing.paidAmount) + Number(record.paidAmount);
      } else {
        outstandingMap.set(key, { ...record });
      }
    } else {
      deduplicatedRecords.push(record);
    }
  }

  // Add merged outstanding fees
  deduplicatedRecords.push(...Array.from(outstandingMap.values()));

  // Sort: recently paid first (by paidAt desc), then unpaid by dueDate asc (soonest due first)
  deduplicatedRecords.sort((a, b) => {
    const aPaid = a.status === "PAID";
    const bPaid = b.status === "PAID";

    // Both paid → most recently paid first
    if (aPaid && bPaid) {
      return new Date(b.paidAt ?? b.dueDate).getTime() - new Date(a.paidAt ?? a.dueDate).getTime();
    }
    // Paid always comes before unpaid
    if (aPaid) return -1;
    if (bPaid) return 1;
    // Both unpaid → soonest due date first (overdue/upcoming in order)
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const records_final = deduplicatedRecords;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={easeOut}>
        <h1 className="text-2xl font-bold text-[#444] tracking-tight">Fee Management</h1>
        <p className="mt-1 text-sm text-gray-400">Track your payments and outstanding balances.</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <StatCard label="Total Fees" value={`₹${summary.totalDue.toLocaleString()}`} sub="Academic year 2026"
          icon={<CreditCard size={18} className="text-primary" />} iconBg="bg-primary-50" delay={0.05} />
        <StatCard label="Amount Paid" value={`₹${summary.totalPaid.toLocaleString()}`} sub="Paid to date"
          icon={<CheckCircle2 size={18} className="text-emerald-600" />} iconBg="bg-emerald-50"
          badge="Updated" badgeVariant="success" delay={0.1} />
        <StatCard label="Outstanding" value={`₹${summary.outstanding.toLocaleString()}`} sub="Balance due"
          icon={<AlertCircle size={18} className="text-red-500" />} iconBg="bg-red-50"
          badge={summary.outstanding > 0 ? "Action needed" : "Cleared"} badgeVariant={summary.outstanding > 0 ? "danger" : "success"} delay={0.15} />
      </motion.div>

      {summary.outstanding > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeOut, delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 p-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <motion.div
                className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertCircle size={18} className="text-red-500" />
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-red-700">Outstanding payment detected</p>
                <p className="text-xs text-red-500 mt-0.5">₹{summary.outstanding.toLocaleString()} is remaining. Please pay immediately to avoid penalties.</p>
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              icon={<ArrowUpRight size={14} />}
              className="shrink-0"
              onClick={payOutstanding}
              loading={payingFeeId === -1}
            >
              Pay Now
            </Button>
          </div>
        </motion.div>
      )}

      {/* Fee table */}
      <Card title="Payment Schedule" subtitle="All terms for academic year 2026" noPadding delay={0.25}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {["Term", "Amount", "Due Date", "Paid On", "Status", "Action"].map((h, i) => (
                  <th key={h} className={`px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide ${i === 5 ? "text-right" : "text-left"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records_final.map((row, i) => {
                const cfg = statusConfig[row.status];
                const isOverdue = row.status === "OVERDUE";
                const isPaid = row.status === "PAID";
                const instInfo = installmentData[row.id];
                const hasInstallment = !!instInfo?.request;
                const installmentsList = instInfo?.installments || [];
                const installmentPlanApproved = instInfo?.request?.status === "APPROVED";
                const anyInstallmentPaid = installmentsList.some((i) => i.status === "PAID");
                const canDownloadReceipt =
                  isPaid || (installmentPlanApproved && anyInstallmentPaid);
                
                return (
                  <>
                    <motion.tr
                      key={`row-${row.id}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...easeOut, delay: 0.3 + i * 0.07 }}
                      whileHover={{ backgroundColor: isOverdue ? "rgba(254,242,242,0.8)" : "rgba(249,250,251,0.8)" }}
                      className={`transition-colors ${isOverdue ? "bg-red-50/40" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <motion.div
                            className={`h-2 w-2 rounded-full shrink-0 ${isPaid ? "bg-emerald-400" : isOverdue ? "bg-red-400" : "bg-gray-300"}`}
                            animate={isOverdue ? { scale: [1, 1.4, 1] } : {}}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <span className="font-medium text-[#444]">{row.term}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-[#444]">₹{Number(row.amount).toLocaleString()}</span>
                          {row.penaltyAmount && Number(row.penaltyAmount) > 0 && (
                            <span className="text-xs text-red-600 font-medium">
                              + ₹{Number(row.penaltyAmount).toLocaleString()} penalty
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>{new Date(row.dueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-gray-400">{isPaid && row.paidAt ? new Date(row.paidAt).toLocaleDateString() : "—"}</td>
                      <td className="px-6 py-4"><Badge variant={cfg.variant} dot>{cfg.label}</Badge></td>
                      <td className="px-6 py-4 text-right">
                        {canDownloadReceipt ? (
                          <motion.button
                            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors"
                            whileHover={{ scale: 1.05 }}
                            onClick={() => downloadReceipt(row.id)}
                          >
                            <Download size={12} /> Receipt
                          </motion.button>
                        ) : !isPaid ? (
                          <div className="flex flex-col items-end gap-2">
                            {isOverdue || row.paidAmount > 0 ? (
                              <Button
                                variant={isOverdue ? "danger" : "primary"}
                                size="xs"
                                loading={payingFeeId === row.id}
                                onClick={() => startPayment(row.id)}
                              >
                                {row.paidAmount > 0 ? "Pay Remaining" : "Pay Now"}
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-300">Not due yet</span>
                            )}
                            {!hasInstallment && (
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => {
                                  setSelectedFeeForInstallment(row);
                                  setModalOpen(true);
                                }}
                              >
                                <FileText size={12} /> Request Installment
                              </Button>
                            )}
                          </div>
                        ) : null}
                      </td>
                    </motion.tr>
                    
                    {/* Installment Status Row */}
                    {hasInstallment && (
                      <tr key={`install-${row.id}`} className="bg-blue-50/30">
                        <td colSpan={6} className="px-6 py-4">
                          <InstallmentStatus
                            feeId={row.id}
                            installments={installmentsList}
                            requestStatus={instInfo?.request?.status || "PENDING"}
                            onPaymentSuccess={reloadFees}
                            onDownloadReceipt={(installmentId) =>
                              downloadReceipt(row.id, installmentId)
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...easeOut, delay: 0.5 }}
        className="text-xs text-gray-400 text-center"
      >
        For payment issues, contact{" "}
        <a href="mailto:fees@kalnet.edu" className="text-primary hover:underline">fees@kalnet.edu</a>
      </motion.p>

      {/* Installment Request Modal */}
      {selectedFeeForInstallment && (
        <InstallmentRequestModal
          feeId={selectedFeeForInstallment.id}
          feeAmount={Number(selectedFeeForInstallment.amount)}
          feeTerm={selectedFeeForInstallment.term}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedFeeForInstallment(null);
          }}
          onSuccess={() => {
            reloadFees();
          }}
        />
      )}
    </div>
  );
}
