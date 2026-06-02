"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Download, Trash2, Clock, CheckCircle2,
  XCircle, AlertCircle, Loader2, ChevronDown, X, RefreshCw,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { easeOut } from "@/components/motion/MotionConfig";
import { sortByDesc } from "@/lib/sortOrder";

interface BonafideRequest {
  id: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  approvedAt: string | null;
  approvedByStaffId: number | null;
  approvedByStaffName: string | null;
  rejectionReason: string | null;
}

const statusConfig = {
  PENDING:  { variant: "warning" as const, icon: Clock,        label: "Pending",  color: "text-amber-500",   bg: "bg-amber-50"  },
  APPROVED: { variant: "success" as const, icon: CheckCircle2, label: "Approved", color: "text-emerald-600", bg: "bg-emerald-50" },
  REJECTED: { variant: "danger"  as const, icon: XCircle,      label: "Rejected", color: "text-red-500",     bg: "bg-red-50"    },
};

export default function BonafideClient() {
  const [requests, setRequests]       = useState<BonafideRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState("");
  const [showForm, setShowForm]       = useState(false);
  const [reason, setReason]           = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState("");
  const [downloading, setDownloading] = useState<number | null>(null);
  const [cancelling, setCancelling]   = useState<number | null>(null);
  const [cancelError, setCancelError] = useState("");
  const [expandedId, setExpandedId]   = useState<number | null>(null);

  async function fetchRequests() {
    setLoadError("");
    setLoading(true);
    try {
      const res = await fetch("/api/bonafide");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRequests(Array.isArray(data) ? sortByDesc(data, (r) => r.requestedAt) : []);
    } catch {
      setLoadError("Failed to load requests. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRequests(); }, []);

  // ── Submit new request ──────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const trimmed = reason.trim();
    if (!trimmed) { setFormError("Please describe the purpose of the certificate."); return; }
    if (trimmed.length < 10) { setFormError("Please provide a more detailed reason (at least 10 characters)."); return; }
    if (trimmed.length > 300) { setFormError("Reason must be 300 characters or less."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bonafide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Failed to submit request."); return; }
      setRequests(prev => [data, ...prev]);
      setReason("");
      setShowForm(false);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Cancel pending request ──────────────────────────────────────────────────
  async function handleCancel(id: number) {
    setCancelError("");
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    setCancelling(id);
    try {
      const res = await fetch(`/api/bonafide/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        setCancelError(d.error || "Failed to cancel request.");
        return;
      }
      setRequests(prev => prev.filter(r => r.id !== id));
      setExpandedId(null);
    } catch {
      setCancelError("Something went wrong. Please try again.");
    } finally {
      setCancelling(null);
    }
  }

  // ── Download certificate ────────────────────────────────────────────────────
  function handleDownload(id: number) {
    setDownloading(id);
    window.open(`/api/bonafide/${id}/pdf`, "_blank", "noopener,noreferrer");
    setTimeout(() => setDownloading(null), 800);
  }

  const hasPending = requests.some(r => r.status === "PENDING");

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeOut}
        className="relative overflow-hidden rounded-2xl bg-gradient-primary p-6 text-white shadow-glow-lg"
      >
        <div className="absolute inset-0 bg-mesh-pattern opacity-30" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                <FileText size={16} className="text-white" />
              </div>
              <p className="text-sm text-white/70 font-medium">Student Portal</p>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Bonafide Certificate</h1>
            <p className="mt-1 text-sm text-white/70">
              Request an official bonafide certificate for bank, visa, or other purposes.
            </p>
          </div>
          <motion.button
            onClick={() => { setShowForm(v => !v); setFormError(""); setReason(""); }}
            disabled={hasPending}
            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${hasPending
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-white text-primary hover:bg-primary-50 shadow-sm"
              }`}
            whileHover={hasPending ? {} : { scale: 1.03 }}
            whileTap={hasPending ? {} : { scale: 0.97 }}
            title={hasPending ? "You already have a pending request" : "New request"}
          >
            <Plus size={16} />
            New Request
          </motion.button>
        </div>
        {hasPending && (
          <p className="relative mt-3 text-xs text-white/60 flex items-center gap-1.5">
            <AlertCircle size={12} />
            You have a pending request. New requests are disabled until it is processed.
          </p>
        )}
      </motion.div>

      {/* ── New Request Form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ ...easeOut, duration: 0.25 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Plus size={14} className="text-primary" />
                </div>
                <h2 className="text-sm font-semibold text-[#444]">New Bonafide Request</h2>
              </div>
              <button
                onClick={() => { setShowForm(false); setFormError(""); setReason(""); }}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Purpose / Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={4}
                  placeholder="e.g. Required for bank account opening, visa application, scholarship form..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#444] placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all"
                />
                <div className="flex items-center justify-between mt-1">
                  {formError
                    ? <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{formError}</p>
                    : <span />
                  }
                  <span className={`text-xs ml-auto ${reason.length > 300 ? "text-red-400" : "text-gray-400"}`}>
                    {reason.length}/300
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <motion.button
                  type="submit"
                  disabled={submitting || reason.length > 300}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold
                    hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-glow"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                  {submitting ? "Submitting…" : "Submit Request"}
                </motion.button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(""); setReason(""); }}
                  className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Requests List ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <FileText size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-[#444]">My Requests</h2>
          {requests.length > 0 && (
            <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {requests.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading requests…</span>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <AlertCircle size={32} className="mb-2 text-red-400 opacity-70" />
            <p className="text-sm text-red-500 font-medium">{loadError}</p>
            <button
              onClick={fetchRequests}
              className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <RefreshCw size={12} /> Try again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No requests yet</p>
            <p className="text-xs mt-1">Click &quot;New Request&quot; to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {requests.map((req, i) => {
              const cfg = statusConfig[req.status];
              const Icon = cfg.icon;
              const isExpanded = expandedId === req.id;

              return (
                <motion.li
                  key={req.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...easeOut, delay: i * 0.05 }}
                >
                  {/* Row header — click to expand */}
                  <div
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer"
                    onClick={() => { setExpandedId(isExpanded ? null : req.id); setCancelError(""); }}
                  >
                    <div className={`h-9 w-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <Icon size={17} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#444] truncate">{req.reason}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Submitted {new Date(req.requestedAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
                      <ChevronDown
                        size={14}
                        className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>

                  {/* Expanded detail panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        key={`detail-${req.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-3 bg-gray-50/40 border-t border-gray-100 space-y-3">

                          {/* Meta grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Request ID</p>
                              <p className="text-sm text-[#444] font-medium mt-0.5">
                                KALNET/BON/{new Date(req.requestedAt).getFullYear()}/{String(req.id).padStart(4, "0")}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</p>
                              <p className={`text-sm font-semibold mt-0.5 ${cfg.color}`}>{cfg.label}</p>
                            </div>
                            {req.status === "APPROVED" ? (
                              <>
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Approved On</p>
                                  <p className="text-sm text-[#444] mt-0.5">
                                    {req.approvedAt ? (() => {
                                      const d = new Date(req.approvedAt);
                                      const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                                      return `${d.getDate()} ${fullMonths[d.getMonth()]} ${d.getFullYear()}`;
                                    })() : "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Approved By</p>
                                  <p className="text-sm text-[#444] font-medium mt-0.5">
                                    {req.approvedByStaffName || "—"}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Approved By</p>
                                <p className="text-sm text-[#444] mt-0.5">
                                  Pending
                                </p>
                              </div>
                            )}
                            {req.rejectionReason && (
                              <div className="col-span-2">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Rejection Reason</p>
                                <p className="text-sm text-red-500 mt-0.5 bg-red-50 rounded-lg px-3 py-2">{req.rejectionReason}</p>
                              </div>
                            )}
                          </div>

                          {/* Cancel error */}
                          {cancelError && cancelling === null && (
                            <p className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-xl">
                              <AlertCircle size={12} />{cancelError}
                            </p>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            {req.status === "APPROVED" && (
                              <motion.button
                                onClick={() => handleDownload(req.id)}
                                disabled={downloading === req.id}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold
                                  hover:bg-primary-600 disabled:opacity-60 transition-colors shadow-glow"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                              >
                                {downloading === req.id
                                  ? <Loader2 size={13} className="animate-spin" />
                                  : <Download size={13} />
                                }
                                {downloading === req.id ? "Opening…" : "Download Certificate"}
                              </motion.button>
                            )}

                            {req.status === "PENDING" && (
                              <motion.button
                                onClick={() => handleCancel(req.id)}
                                disabled={cancelling === req.id}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-semibold
                                  hover:bg-red-100 disabled:opacity-60 transition-colors"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                              >
                                {cancelling === req.id
                                  ? <Loader2 size={13} className="animate-spin" />
                                  : <Trash2 size={13} />
                                }
                                {cancelling === req.id ? "Cancelling…" : "Cancel Request"}
                              </motion.button>
                            )}

                            {req.status === "REJECTED" && (
                              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                <XCircle size={12} className="text-red-400" />
                                This request was rejected. You may submit a new request.
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </ul>
        )}
      </motion.div>

      {/* ── How it works ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0.15 }}
        className="bg-primary-50 rounded-2xl border border-primary-100 p-4"
      >
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
            <AlertCircle size={15} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-700">How it works</p>
            <ul className="mt-1.5 space-y-1 text-xs text-primary-600">
              <li>1. Submit a request with the purpose of the certificate.</li>
              <li>2. Non-teaching staff will review and approve or reject it.</li>
              <li>3. Once approved, click &quot;Download Certificate&quot; — a print dialog opens to save as PDF.</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
