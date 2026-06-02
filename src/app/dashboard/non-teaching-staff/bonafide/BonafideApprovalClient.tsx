"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle2, XCircle, Clock, AlertCircle,
  Loader2, Search, X, ChevronDown, Users, RefreshCw,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { easeOut } from "@/components/motion/MotionConfig";
import { sortByDesc } from "@/lib/sortOrder";

interface StudentInfo {
  id: number;
  name: string | null;
  email: string;
  rollNumber: string | null;
  classEnrolled: string | null;
}

interface BonafideRequest {
  id: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  approvedAt: string | null;
  approvedByStaffId: number | null;
  approvedByStaffName: string | null;
  rejectionReason: string | null;
  student: StudentInfo;
}

const statusConfig = {
  PENDING:  { variant: "warning" as const, icon: Clock,        label: "Pending",  color: "text-amber-500",   bg: "bg-amber-50"  },
  APPROVED: { variant: "success" as const, icon: CheckCircle2, label: "Approved", color: "text-emerald-600", bg: "bg-emerald-50" },
  REJECTED: { variant: "danger"  as const, icon: XCircle,      label: "Rejected", color: "text-red-500",     bg: "bg-red-50"    },
};

export default function BonafideApprovalClient() {
  const [requests, setRequests]   = useState<BonafideRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter]       = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [search, setSearch]       = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Per-row action state
  const [approvingId, setApprovingId]   = useState<number | null>(null);
  const [approveError, setApproveError] = useState<Record<number, string>>({});
  const [rejectingId, setRejectingId]   = useState<number | null>(null); // which row has reject form open
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [rejectError, setRejectError]   = useState("");

  // ── Load ──────────────────────────────────────────────────────────────────
  async function fetchRequests() {
    setLoadError("");
    setLoading(true);
    try {
      const res = await fetch("/api/bonafide");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRequests(Array.isArray(data) ? sortByDesc(data, (r) => r.requestedAt) : []);
    } catch {
      setLoadError("Failed to load requests. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRequests(); }, []);

  // ── Approve ───────────────────────────────────────────────────────────────
  async function handleApprove(id: number) {
    setApprovingId(id);
    setApproveError(prev => ({ ...prev, [id]: "" }));
    try {
      const res = await fetch(`/api/bonafide/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApproveError(prev => ({ ...prev, [id]: data.error || "Failed to approve." }));
        return;
      }
      setRequests(prev =>
        prev.map(r => r.id === id ? { ...r, ...data } : r)
      );
      setExpandedId(null);
      setRejectingId(null);
    } finally {
      setApprovingId(null);
    }
  }

  // ── Open reject form ──────────────────────────────────────────────────────
  function openRejectForm(id: number) {
    setRejectingId(id);
    setRejectReason("");
    setRejectError("");
    setApproveError(prev => ({ ...prev, [id]: "" }));
  }

  // ── Submit rejection ──────────────────────────────────────────────────────
  async function handleReject(id: number) {
    setRejectError("");
    if (!rejectReason.trim()) {
      setRejectError("Please provide a rejection reason.");
      return;
    }
    setRejectSubmitting(true);
    try {
      const res = await fetch(`/api/bonafide/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", rejectionReason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRejectError(data.error || "Failed to reject. Please try again.");
        return;
      }
      setRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status: "REJECTED", rejectionReason: rejectReason.trim() } : r)
      );
      setRejectingId(null);
      setRejectReason("");
      setExpandedId(null);
    } finally {
      setRejectSubmitting(false);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const counts = {
    ALL:      requests.length,
    PENDING:  requests.filter(r => r.status === "PENDING").length,
    APPROVED: requests.filter(r => r.status === "APPROVED").length,
    REJECTED: requests.filter(r => r.status === "REJECTED").length,
  };

  const filtered = requests.filter(r => {
    if (filter !== "ALL" && r.status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.student.name?.toLowerCase().includes(q) ||
      r.student.rollNumber?.toLowerCase().includes(q) ||
      r.student.email?.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q)
    );
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
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
              <p className="text-sm text-white/70 font-medium">Non-Teaching Staff</p>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Bonafide Approval</h1>
            <p className="mt-1 text-sm text-white/70">
              Review and process student bonafide certificate requests.
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1">
            <span className="text-3xl font-bold">{counts.PENDING}</span>
            <span className="text-xs text-white/70">Pending</span>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0.05 }}
      >
        {(["PENDING", "APPROVED", "REJECTED"] as const).map(s => {
          const cfg = statusConfig[s];
          const Icon = cfg.icon;
          return (
            <div key={s} className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
              <div className={`h-8 w-8 rounded-xl ${cfg.bg} flex items-center justify-center mb-2`}>
                <Icon size={16} className={cfg.color} />
              </div>
              <p className="text-2xl font-bold text-[#444]">{counts[s]}</p>
              <p className="text-xs text-gray-400 mt-0.5">{cfg.label}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Filters + Search */}
      <motion.div
        className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0.08 }}
      >
        <div className="flex gap-1.5 flex-wrap">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                ${filter === f
                  ? "bg-primary text-white shadow-glow"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              <span className="ml-1.5 opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, roll number, or reason…"
            className="w-full pl-8 pr-8 py-2 rounded-xl border border-gray-200 text-sm text-[#444]
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30
              focus:border-primary transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Requests list */}
      <motion.div
        className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0.1 }}
      >
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <Users size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-[#444]">
            {filter === "ALL" ? "All Requests" : `${filter.charAt(0) + filter.slice(1).toLowerCase()} Requests`}
          </h2>
          <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {filtered.length}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        )}

        {/* Load error */}
        {!loading && loadError && (
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
        )}

        {/* Empty */}
        {!loading && !loadError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">
              {requests.length === 0 ? "No requests yet" : "No requests match your filter"}
            </p>
            {search && <p className="text-xs mt-1">Try adjusting your search.</p>}
          </div>
        )}

        {/* List */}
        {!loading && !loadError && filtered.length > 0 && (
          <ul className="divide-y divide-gray-50">
            {filtered.map((req, i) => {
              const cfg = statusConfig[req.status];
              const Icon = cfg.icon;
              const isExpanded = expandedId === req.id;
              const isRejectOpen = rejectingId === req.id;

              return (
                <motion.li
                  key={req.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...easeOut, delay: i * 0.04 }}
                >
                  {/* Row */}
                  <div
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : req.id);
                      if (isExpanded) {
                        setRejectingId(null);
                        setRejectReason("");
                        setRejectError("");
                      }
                    }}
                  >
                    <div className={`h-9 w-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <Icon size={17} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#444]">{req.student.name ?? "Unknown"}</p>
                        {req.student.rollNumber && (
                          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">
                            {req.student.rollNumber}
                          </span>
                        )}
                        {req.student.classEnrolled && (
                          <span className="text-[10px] font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded-md">
                            {req.student.classEnrolled}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{req.reason}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(req.requestedAt).toLocaleDateString("en-IN", {
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

                  {/* Expanded panel */}
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
                        <div className="px-5 pb-5 pt-3 bg-gray-50/40 border-t border-gray-100 space-y-4">

                          {/* Details grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                              ["Student",   req.student.name ?? "—"],
                              ["Email",     req.student.email],
                              ["Roll No.",  req.student.rollNumber ?? "—"],
                              ["Class",     req.student.classEnrolled ?? "—"],
                              ["Submitted", new Date(req.requestedAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                              })],
                              ["Status",    cfg.label],
                            ].map(([label, value]) => (
                              <div key={label}>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                                <p className="text-sm text-[#444] mt-0.5 truncate">{value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Purpose */}
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Purpose</p>
                            <p className="text-sm text-[#444] bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                              {req.reason}
                            </p>
                          </div>

                          {/* Rejection reason (if already rejected) */}
                          {req.status === "REJECTED" && req.rejectionReason && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                Rejection Reason
                              </p>
                              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2.5">
                                {req.rejectionReason}
                              </p>
                            </div>
                          )}

                          {/* Approved info */}
                          {req.status === "APPROVED" && req.approvedAt && (
                            <div className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2.5 rounded-xl space-y-1">
                              <p className="flex items-center gap-1.5 font-medium">
                                <CheckCircle2 size={12} />
                                Approved on {new Date(req.approvedAt).toLocaleDateString("en-IN", {
                                  day: "numeric", month: "long", year: "numeric",
                                })}
                              </p>
                              {req.approvedByStaffName && (
                                <p className="text-[11px] text-emerald-700/80 font-medium pl-5">
                                  Approved By: {req.approvedByStaffName}
                                </p>
                              )}
                            </div>
                          )}

                          {/* ── Actions for PENDING only ── */}
                          {req.status === "PENDING" && (
                            <>
                              {/* Approve error */}
                              {approveError[req.id] && (
                                <p className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-xl">
                                  <AlertCircle size={12} />{approveError[req.id]}
                                </p>
                              )}

                              {/* Reject form */}
                              {isRejectOpen ? (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-red-50 rounded-xl border border-red-100 p-4 space-y-3"
                                >
                                  <p className="text-sm font-semibold text-red-600">Provide rejection reason</p>
                                  <textarea
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    rows={3}
                                    placeholder="e.g. Incomplete information, duplicate request…"
                                    className="w-full px-3 py-2.5 rounded-xl border border-red-200 text-sm text-[#444]
                                      placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300
                                      focus:border-red-400 resize-none transition-all bg-white"
                                  />
                                  {rejectError && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                      <AlertCircle size={11} />{rejectError}
                                    </p>
                                  )}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleReject(req.id)}
                                      disabled={rejectSubmitting}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl
                                        text-xs font-semibold hover:bg-red-600 disabled:opacity-60 transition-colors"
                                    >
                                      {rejectSubmitting
                                        ? <Loader2 size={12} className="animate-spin" />
                                        : <XCircle size={12} />
                                      }
                                      Confirm Reject
                                    </button>
                                    <button
                                      onClick={() => { setRejectingId(null); setRejectReason(""); setRejectError(""); }}
                                      className="px-4 py-2 text-xs text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </motion.div>
                              ) : (
                                /* Approve / Reject buttons */
                                <div className="flex items-center gap-2">
                                  <motion.button
                                    onClick={() => handleApprove(req.id)}
                                    disabled={approvingId === req.id}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl
                                      text-xs font-semibold hover:bg-primary-600 disabled:opacity-60
                                      transition-colors shadow-glow"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                  >
                                    {approvingId === req.id
                                      ? <Loader2 size={13} className="animate-spin" />
                                      : <CheckCircle2 size={13} />
                                    }
                                    {approvingId === req.id ? "Approving…" : "Approve"}
                                  </motion.button>
                                  <motion.button
                                    onClick={() => openRejectForm(req.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl
                                      text-xs font-semibold hover:bg-red-100 transition-colors"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                  >
                                    <XCircle size={13} />
                                    Reject
                                  </motion.button>
                                </div>
                              )}
                            </>
                          )}
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
    </div>
  );
}
