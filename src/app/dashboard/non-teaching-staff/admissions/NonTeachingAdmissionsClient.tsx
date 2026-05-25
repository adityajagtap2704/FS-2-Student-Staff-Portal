"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Admission = {
  id: number;
  referenceNumber: string;
  studentName: string;
  parentName: string;
  email: string;
  phone: string;
  classApplied: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
};

const ADM_PAGE_SIZE = 10;

export default function NonTeachingAdmissionsClient() {
  const toast = useToast();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [admFilter, setAdmFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [admPage, setAdmPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; message: string; onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  useEffect(() => {
    fetch("/api/admissions")
      .then(r => r.json())
      .then(d => { setAdmissions(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const showConfirm = (title: string, message: string, onConfirm: () => void) =>
    setConfirmDialog({ open: true, title, message, onConfirm });
  const closeConfirm = () => setConfirmDialog(d => ({ ...d, open: false }));

  const handleAdmissionAction = async (id: number, status: "APPROVED" | "REJECTED") => {
    const adm = admissions.find(a => a.id === id);
    showConfirm(
      `${status === "APPROVED" ? "Approve" : "Reject"} Admission`,
      `${status === "APPROVED"
        ? `Approving will create a student account for "${adm?.studentName}" and send credentials to ${adm?.email}.`
        : `Rejecting will notify "${adm?.studentName}"'s parent at ${adm?.email}.`
      } This cannot be undone.`,
      async () => {
        closeConfirm();
        const res = await fetch(`/api/admissions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          setAdmissions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
          toast.success(
            `Admission ${status.toLowerCase()}`,
            status === "APPROVED" ? "Student account created & email sent." : "Rejection email sent."
          );
        } else {
          toast.error("Action failed", "Please try again.");
        }
      }
    );
  };

  const filteredAdmissions = admFilter === "ALL" ? admissions : admissions.filter(a => a.status === admFilter);
  const admTotalPages = Math.max(1, Math.ceil(filteredAdmissions.length / ADM_PAGE_SIZE));
  const paginatedAdmissions = filteredAdmissions.slice((admPage - 1) * ADM_PAGE_SIZE, admPage * ADM_PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Confirm Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-w-sm w-full mx-4"
          >
            <h3 className="text-base font-bold text-[#444]">{confirmDialog.title}</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-3 mt-5 justify-end">
              <Button variant="outline" size="sm" onClick={closeConfirm}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={confirmDialog.onConfirm}>Confirm</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#444] tracking-tight">Admissions</h1>
        <p className="mt-1 text-sm text-gray-400">Review and manage student admission enquiries.</p>
      </motion.div>

      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map(f => (
          <button
            key={f}
            onClick={() => { setAdmFilter(f); setAdmPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
              admFilter === f
                ? "bg-primary text-white shadow-glow"
                : "bg-white border border-gray-200 text-gray-500 hover:border-primary hover:text-primary"
            }`}
          >
            {f}{f !== "ALL" && <span className="ml-1 opacity-70">({admissions.filter(a => a.status === f).length})</span>}
          </button>
        ))}
      </div>

      <Card title="Admission Enquiries" subtitle="All submitted enquiries" noPadding delay={0.1}>
        {loading ? (
          <SkeletonTable rows={5} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["Ref No.", "Student", "Parent", "Email", "Phone", "Class", "Submitted", "Status", "Action"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedAdmissions.map((a) => (
                    <tr key={a.id} className={`hover:bg-gray-50/50 transition-colors ${a.status === "PENDING" ? "bg-blue-50/20" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{a.referenceNumber}</td>
                      <td className="px-4 py-3 font-medium text-[#444] whitespace-nowrap">{a.studentName}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{a.parentName}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{a.email}</td>
                      <td className="px-4 py-3 text-gray-400">{a.phone}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{a.classApplied}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(a.submittedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Badge variant={a.status === "APPROVED" ? "success" : a.status === "REJECTED" ? "danger" : "warning"} dot>
                          {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {a.status === "PENDING" ? (
                          <div className="flex items-center gap-1.5">
                            <Button size="xs" variant="secondary" onClick={() => handleAdmissionAction(a.id, "APPROVED")}>Approve</Button>
                            <Button size="xs" variant="danger"    onClick={() => handleAdmissionAction(a.id, "REJECTED")}>Reject</Button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">Done</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {paginatedAdmissions.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No enquiries found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {admTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
                <p className="text-xs text-gray-400">{filteredAdmissions.length} total · Page {admPage} of {admTotalPages}</p>
                <div className="flex gap-1.5">
                  <button onClick={() => setAdmPage(p => Math.max(1, p - 1))} disabled={admPage === 1}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 disabled:opacity-40 hover:bg-gray-200 transition-colors">Prev</button>
                  <button onClick={() => setAdmPage(p => Math.min(admTotalPages, p + 1))} disabled={admPage === admTotalPages}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 disabled:opacity-40 hover:bg-gray-200 transition-colors">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
