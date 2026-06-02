"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Download, Eye } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { sortByDesc } from "@/lib/sortOrder";
import { staggerContainer, staggerItem, easeOut } from "@/components/motion/MotionConfig";

type Document = {
  id: number;
  studentId: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  verifiedByStaffId?: number | null;
  verifiedByStaffName?: string | null;
  rejectionReason?: string;
  student?: {
    id: number;
    name: string;
    email: string;
    classEnrolled: string;
  };
};

const statusConfig: Record<string, { variant: "success" | "danger" | "neutral"; label: string }> = {
  VERIFIED: { variant: "success", label: "Verified" },
  REJECTED: { variant: "danger", label: "Rejected" },
  PENDING: { variant: "neutral", label: "Pending" },
};

export default function DocumentVerificationClient() {
  const toast = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // Fetch all students and their documents
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("Failed to load students");
      const students = await res.json();

      // Fetch documents for each student
      const allDocs: Document[] = [];
      for (const student of students) {
        try {
          const docRes = await fetch(`/api/students/${student.id}/documents`);
          if (docRes.ok) {
            const docs = await docRes.json();
            allDocs.push(
              ...docs.map((doc: any) => ({
                ...doc,
                student,
              }))
            );
          }
        } catch (error) {
          console.error(`Failed to load documents for student ${student.id}`);
        }
      }

      // Sort by uploadedAt descending (newest first)
      const sorted = sortByDesc(allDocs, (d) => d.uploadedAt);
      
      setDocuments(sorted);
    } catch (error) {
      toast.error("Failed to Load Documents", "Please refresh the page");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleVerify = async (docId: number, status: "VERIFIED" | "REJECTED") => {
    if (status === "REJECTED" && !rejectionReason.trim()) {
      toast.error("Validation Error", "Please provide a rejection reason");
      return;
    }

    try {
      setVerifying(true);
      const res = await fetch(`/api/students/documents/${docId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          rejectionReason: status === "REJECTED" ? rejectionReason : null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Verification failed");
      }

      const result = await res.json();
      
      // Show document-specific alert
      if (status === "VERIFIED") {
        toast.success(
          `${selectedDoc?.documentType} Verified`,
          `Document for ${selectedDoc?.student?.name} has been verified successfully.`
        );
      } else {
        toast.success(
          `${selectedDoc?.documentType} Rejected`,
          `Document for ${selectedDoc?.student?.name} has been rejected. Reason: ${rejectionReason}`
        );
      }
      
      setShowVerifyModal(false);
      setRejectionReason("");
      setSelectedDoc(null);
      await loadDocuments();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Please try again";
      toast.error(
        "Verification Failed",
        `${selectedDoc?.documentType}: ${errorMsg}`
      );
      console.error(error);
    } finally {
      setVerifying(false);
    }
  };

  const filteredDocs = documents.filter((d) => d.status === statusFilter);

  if (loading) {
    return <div className="p-10 text-center text-gray-400">Loading documents...</div>;
  }

  const pendingCount = documents.filter((d) => d.status === "PENDING").length;
  const verifiedCount = documents.filter((d) => d.status === "VERIFIED").length;
  const rejectedCount = documents.filter((d) => d.status === "REJECTED").length;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={easeOut}>
        <h1 className="text-2xl font-bold text-[#444] tracking-tight">Document Verification</h1>
        <p className="mt-1 text-sm text-gray-400">Review and verify student documents.</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem} className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
            </div>
            <Clock size={24} className="text-yellow-600" />
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Verified</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{verifiedCount}</p>
            </div>
            <CheckCircle2 size={24} className="text-emerald-600" />
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Rejected</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{rejectedCount}</p>
            </div>
            <XCircle size={24} className="text-red-600" />
          </div>
        </motion.div>
      </motion.div>

      {/* Filter */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...easeOut, delay: 0.2 }}>
        <div className="flex gap-2">
          {["PENDING", "VERIFIED", "REJECTED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Verification Modal */}
      {showVerifyModal && selectedDoc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowVerifyModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#444] mb-4">Verify Document</h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Student:</span> {selectedDoc.student?.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Class:</span> {selectedDoc.student?.classEnrolled}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Document:</span> {selectedDoc.documentType}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">File:</span> {selectedDoc.fileName}
                </p>
              </div>

              <div className="border-t pt-4">
                {selectedDoc.fileUrl ? (
                  <motion.button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/students/documents/${selectedDoc.id}/signed-url`);
                        if (res.ok) {
                          const data = await res.json();
                          if (data.isBase64) {
                            // For base64 documents, open directly
                            window.open(data.signedUrl, "_blank");
                          } else {
                            // For S3 documents, open signed URL
                            window.open(data.signedUrl, "_blank");
                          }
                        } else {
                          const error = await res.json();
                          toast.error("Error", error.error || "Failed to generate download link");
                        }
                      } catch (error) {
                        toast.error("Error", "Failed to generate download link");
                      }
                    }}
                    className="inline-flex items-center gap-2 text-primary hover:text-primary-600 text-sm font-medium"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Eye size={16} />
                    View Document
                  </motion.button>
                ) : (
                  <p className="text-sm text-gray-500">Document URL not available</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason (if rejecting)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this document is being rejected..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowVerifyModal(false);
                  setRejectionReason("");
                  setSelectedDoc(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleVerify(selectedDoc.id, "REJECTED")}
                loading={verifying}
                className="flex-1"
              >
                Reject
              </Button>
              <Button
                onClick={() => handleVerify(selectedDoc.id, "VERIFIED")}
                loading={verifying}
                className="flex-1"
              >
                Verify
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Documents List */}
      <Card title={`${statusFilter} Documents`} subtitle={`${filteredDocs.length} document(s)`} noPadding delay={0.25}>
        {filteredDocs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Eye size={48} className="mx-auto mb-3 opacity-50" />
            <p>No {statusFilter.toLowerCase()} documents</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Student", "Class", "Document Type", "File", "Uploaded", "Action"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide ${
                        i === 5 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredDocs.map((doc, i) => (
                  <motion.tr
                    key={doc.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...easeOut, delay: 0.3 + i * 0.07 }}
                    whileHover={{ backgroundColor: "rgba(249,250,251,0.8)" }}
                    className="transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-[#444]">{doc.student?.name}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.student?.classEnrolled}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.documentType}</td>
                    <td className="px-6 py-4 text-gray-600 truncate">{doc.fileName}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.fileUrl && (
                          <motion.button
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/students/documents/${doc.id}/signed-url`);
                                if (res.ok) {
                                  const data = await res.json();
                                  window.open(data.signedUrl, "_blank");
                                } else {
                                  const error = await res.json();
                                  toast.error("Error", error.error || "Failed to generate download link");
                                }
                              } catch (error) {
                                toast.error("Error", "Failed to generate download link");
                              }
                            }}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-600 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            title="Download from S3"
                          >
                            <Download size={12} />
                          </motion.button>
                        )}
                        {doc.status === "PENDING" && (
                          <Button
                            size="xs"
                            onClick={() => {
                              setSelectedDoc(doc);
                              setShowVerifyModal(true);
                            }}
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
