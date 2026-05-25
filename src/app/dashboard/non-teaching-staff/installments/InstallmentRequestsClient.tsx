"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Clock, CheckCircle2, XCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { sortByDesc } from "@/lib/sortOrder";

type InstallmentRequest = {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  numberOfInstallments: number;
  reason: string;
  requestedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  student: {
    id: number;
    name: string;
    email: string;
    classEnrolled: string;
    rollNumber: string;
  };
  fee: {
    id: number;
    term: string;
    amount: number;
    paidAmount: number;
    dueDate: string;
    status: string;
  };
};

export default function InstallmentRequestsClient() {
  const toast = useToast();
  const [requests, setRequests] = useState<InstallmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; requestId: number | null }>({
    open: false,
    requestId: null,
  });
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/non-teaching-staff/installments");
      const data = await res.json();
      const list = Array.isArray(data.requests) ? data.requests : [];
      setRequests(sortByDesc(list, (r) => r.requestedAt));
    } catch (err) {
      console.error("Error fetching installment requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/non-teaching-staff/installments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed to approve", data.error || "Please try again.");
        return;
      }
      toast.success("Request approved", "Student has been notified via email and in-app notification.");
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" } : r))
      );
    } catch {
      toast.error("Error", "Something went wrong. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.requestId) return;
    try {
      setActionLoading(rejectModal.requestId);
      const res = await fetch(`/api/non-teaching-staff/installments/${rejectModal.requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed to reject", data.error || "Please try again.");
        return;
      }
      toast.success("Request rejected", "Student has been notified via email and in-app notification.");
      setRequests((prev) =>
        prev.map((r) =>
          r.id === rejectModal.requestId ? { ...r, status: "REJECTED", rejectionReason } : r
        )
      );
      setRejectModal({ open: false, requestId: null });
      setRejectionReason("");
    } catch {
      toast.error("Error", "Something went wrong. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered =
    filter === "ALL" ? requests : requests.filter((r) => r.status === filter);

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-5">
      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-w-sm w-full mx-4"
          >
            <h3 className="text-base font-bold text-[#444]">Reject Installment Request</h3>
            <p className="mt-1 text-sm text-gray-500">
              Provide a reason for rejection. The student will be notified via email.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Insufficient documentation, policy does not allow installments for this term..."
              rows={3}
              className="mt-3 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-[#444] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectModal({ open: false, requestId: null });
                  setRejectionReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={actionLoading === rejectModal.requestId}
                onClick={handleReject}
              >
                Confirm Reject
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#444] tracking-tight">Installment Requests</h1>
        <p className="mt-1 text-sm text-gray-400">
          Review and manage student fee installment requests.
        </p>
      </motion.div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-5 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Pending</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {requests.filter((r) => r.status === "PENDING").length}
              </p>
            </div>
            <Clock size={28} className="text-amber-500" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Approved</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                {requests.filter((r) => r.status === "APPROVED").length}
              </p>
            </div>
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-5 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Rejected</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {requests.filter((r) => r.status === "REJECTED").length}
              </p>
            </div>
            <XCircle size={28} className="text-red-500" />
          </div>
        </div>
      </motion.div>

      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        {(["PENDING", "ALL", "APPROVED", "REJECTED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
              filter === f
                ? "bg-primary text-white shadow-glow"
                : "bg-white border border-gray-200 text-gray-500 hover:border-primary hover:text-primary"
            }`}
          >
            {f}
            {f === "PENDING" && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-400 text-white text-[9px] font-bold px-1 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
            {f !== "PENDING" && (
              <span className="ml-1 opacity-60">
                ({f === "ALL" ? requests.length : requests.filter((r) => r.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests table */}
      <Card title="Installment Requests" subtitle="Student fee installment requests" noPadding delay={0.1}>
        {loading ? (
          <SkeletonTable rows={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {[
                    "Student",
                    "Class",
                    "Roll No.",
                    "Term",
                    "Fee Amount",
                    "Reason",
                    "Requested On",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      r.status === "PENDING" ? "bg-amber-50/20" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-[#444] whitespace-nowrap">
                      {r.student.name}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {r.student.classEnrolled}
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">
                      {r.student.rollNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.fee.term}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      ₹{Number(r.fee.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px]">
                      <p className="truncate" title={r.reason}>
                        {r.reason}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(r.requestedAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          r.status === "APPROVED"
                            ? "success"
                            : r.status === "REJECTED"
                              ? "danger"
                              : "warning"
                        }
                        dot
                      >
                        {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "PENDING" ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="xs"
                            variant="secondary"
                            loading={actionLoading === r.id}
                            onClick={() => handleApprove(r.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="xs"
                            variant="danger"
                            onClick={() => {
                              setRejectModal({ open: true, requestId: r.id });
                              setRejectionReason("");
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">
                          {r.status === "APPROVED" && r.approvedAt && (
                            <span>
                              Approved {new Date(r.approvedAt).toLocaleDateString("en-IN")}
                            </span>
                          )}
                          {r.status === "REJECTED" && r.rejectionReason && (
                            <span
                              className="text-red-400 cursor-help"
                              title={r.rejectionReason}
                            >
                              {r.rejectionReason.length > 30
                                ? r.rejectionReason.slice(0, 30) + "…"
                                : r.rejectionReason}
                            </span>
                          )}
                          {r.status === "REJECTED" && !r.rejectionReason && (
                            <span className="text-gray-300">Rejected</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                      <CreditCard size={32} className="mx-auto mb-2 opacity-40" />
                      <p>No {filter !== "ALL" ? filter.toLowerCase() : ""} installment requests found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
