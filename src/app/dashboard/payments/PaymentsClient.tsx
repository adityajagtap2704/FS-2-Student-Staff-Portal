"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Download, Search, Calendar, DollarSign,
  CheckCircle2, Clock, AlertCircle, Layers,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { easeOut } from "@/components/motion/MotionConfig";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Payment {
  feeId:             number;
  installmentId:     number | null;
  installmentNumber: number | null;
  studentId:         number;
  studentName:       string;
  classEnrolled:     string;
  term:              string;
  feeType:           string;
  amountPaise:       number;
  currency:          string;
  status:            string;
  razorpayOrderId:   string | null;
  razorpayPaymentId: string | null;
  receiptNumber:     string | null;
  updatedAt:         string;
  paymentType:       "FULL" | "INSTALLMENT";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2,
  }).format(paise / 100);
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "—"; }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PaymentsClient({ studentId }: { studentId: number }) {
  const [payments, setPayments]           = useState<Payment[]>([]);
  const [filtered, setFiltered]           = useState<Payment[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [downloading, setDownloading]     = useState<string | null>(null);
  const { success, error, warning }       = useToast();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/payments?limit=100");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setPayments(data.payments ?? []);
      } catch {
        error("Failed to load payment history");
      } finally {
        setLoading(false);
      }
    })();
  }, [error]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase();
    const result = payments.filter(p =>
      !q ||
      p.term?.toLowerCase().includes(q) ||
      p.razorpayPaymentId?.toLowerCase().includes(q) ||
      p.razorpayOrderId?.toLowerCase().includes(q) ||
      p.feeType?.toLowerCase().includes(q)
    );
    setFiltered(result);
  }, [payments, search]);

  // ── Download receipt ───────────────────────────────────────────────────────
  async function handleReceipt(p: Payment) {
    const key = p.installmentId ? `inst-${p.installmentId}` : `fee-${p.feeId}`;
    setDownloading(key);
    try {
      // For installment payments pass installmentId so receipt shows only up to that installment
      const qs = p.installmentId ? `?installmentId=${p.installmentId}` : "";
      const res = await fetch(`/api/fees/${p.feeId}/receipt${qs}`);
      if (!res.ok) { warning("Receipt not available yet"); return; }
      // Open in new tab (auto-triggers print dialog)
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url  = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      success("Receipt opened in new tab");
    } catch {
      error("Failed to open receipt");
    } finally {
      setDownloading(null);
    }
  }

  // ── Summary stats ──────────────────────────────────────────────────────────
  // A fee paid via installments must not be counted again as a full payment.
  // The API already excludes those FULL rows, but we guard here too so the
  // counts stay correct even if old data slips through.
  const feeIdsWithInstallments = new Set(
    payments
      .filter(p => p.paymentType === "INSTALLMENT")
      .map(p => p.feeId)
  );

  const totalPaid = payments
    .filter(p => p.status === "PAID")
    .filter(p => !(p.paymentType === "FULL" && feeIdsWithInstallments.has(p.feeId)))
    .reduce((sum, p) => sum + p.amountPaise / 100, 0);

  const fullCount = payments.filter(
    p => p.paymentType === "FULL" && !feeIdsWithInstallments.has(p.feeId)
  ).length;
  const installmentCount = payments.filter(p => p.paymentType === "INSTALLMENT").length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Summary cards */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeOut}
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[#444]">
            ₹{totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Total paid</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
          <div className="h-9 w-9 rounded-xl bg-primary-50 flex items-center justify-center mb-2">
            <DollarSign size={18} className="text-primary" />
          </div>
          <p className="text-2xl font-bold text-[#444]">{fullCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Full payments</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
            <Layers size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-[#444]">{installmentCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Installment payments</p>
        </div>
      </motion.div>

      {/* Payment history table */}
      <Card title="Payment History" subtitle="All your fee payments including installments" delay={0.1}>
        <div className="space-y-4">

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by term, transaction ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <DollarSign size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Date", "Fee Term", "Type", "Amount", "Status", "Action"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const key        = p.installmentId ? `inst-${p.installmentId}` : `fee-${p.feeId}-${i}`;
                    const isInst     = p.paymentType === "INSTALLMENT";
                    const isDownloading = downloading === (p.installmentId ? `inst-${p.installmentId}` : `fee-${p.feeId}`);

                    return (
                      <motion.tr
                        key={key}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...easeOut, delay: i * 0.03 }}
                        className={`border-b border-gray-50 transition-colors ${
                          isInst ? "hover:bg-blue-50/40" : "hover:bg-gray-50"
                        }`}
                      >
                        {/* Date */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={13} className="text-gray-400 shrink-0" />
                            <span className="text-gray-600 whitespace-nowrap">{formatDate(p.updatedAt)}</span>
                          </div>
                        </td>

                        {/* Term */}
                        <td className="py-3 px-4">
                          <p className="font-medium text-[#444]">{p.term || "—"}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{p.feeType || ""}</p>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-4">
                          {isInst ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                              <Layers size={11} />
                              Installment {p.installmentNumber}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary-50 px-2 py-1 rounded-lg">
                              <DollarSign size={11} />
                              Full Payment
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#444]">{formatCurrency(p.amountPaise)}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {p.status === "PAID"
                            ? <Badge variant="success" dot>Paid</Badge>
                            : p.status === "FAILED"
                              ? <Badge variant="danger" dot>Failed</Badge>
                              : <Badge variant="warning" dot>Pending</Badge>
                          }
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4">
                          {p.status === "PAID" ? (
                            <motion.button
                              onClick={() => handleReceipt(p)}
                              disabled={isDownloading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                bg-primary/10 text-primary hover:bg-primary/20 transition-colors
                                text-xs font-medium disabled:opacity-50"
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                            >
                              {isDownloading
                                ? <div className="h-3 w-3 rounded-full border border-primary border-t-transparent animate-spin" />
                                : <Download size={13} />
                              }
                              <span className="hidden sm:inline">Receipt</span>
                            </motion.button>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <p className="text-xs text-gray-400 text-center pt-1">
              Showing {filtered.length} of {payments.length} transactions
            </p>
          )}
        </div>
      </Card>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0.2 }}
        className="bg-blue-50 border border-blue-100 rounded-2xl p-4"
      >
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <AlertCircle size={15} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">About your payment history</p>
            <ul className="mt-1.5 space-y-1 text-xs text-blue-700">
              <li>
                <span className="font-semibold">Full Payment</span> — the entire fee was paid at once.
              </li>
              <li>
                <span className="font-semibold">Installment 1 / 2</span> — individual installment payments under an approved installment plan.
              </li>
              <li>Click <strong>Receipt</strong> to open a printable receipt for that specific payment.</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
