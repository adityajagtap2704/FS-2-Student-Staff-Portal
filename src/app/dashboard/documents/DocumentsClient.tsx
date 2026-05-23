"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2, Download } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { staggerContainer, staggerItem, easeOut } from "@/components/motion/MotionConfig";

type Document = {
  id: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason?: string;
};

const documentTypes = [
  "Aadhar Card",
  "Birth Certificate",
  "Passport",
  "School Transfer Certificate",
  "Medical Certificate",
  "Other",
];

const statusConfig: Record<string, { variant: "success" | "danger" | "neutral"; label: string }> = {
  VERIFIED: { variant: "success", label: "Verified" },
  REJECTED: { variant: "danger", label: "Rejected" },
  PENDING: { variant: "neutral", label: "Pending" },
};

export default function DocumentsClient({ studentId }: { studentId: number }) {
  const toast = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadDocuments = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/students/${studentId}/documents`);
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      const sorted = data.sort((a: Document, b: Document) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );

      // Detect status changes and show toast notifications
      setDocuments((prev) => {
        const prevMap: Record<number, string> = {};
        prev.forEach((d) => { prevMap[d.id] = d.status; });
        sorted.forEach((d: Document) => {
          const oldStatus = prevMap[d.id];
          if (oldStatus && oldStatus !== d.status) {
            if (d.status === "VERIFIED") {
              toast.success(`${d.documentType} Verified`, "Your document has been verified successfully.");
            } else if (d.status === "REJECTED") {
              toast.error(`${d.documentType} Rejected`, d.rejectionReason || "Your document was rejected.");
            }
          }
        });
        return sorted;
      });
    } catch (error) {
      if (!silent) toast.error("Failed to load documents", "Please refresh the page");
      console.error(error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    // Poll every 15 seconds for status updates
    const interval = setInterval(() => loadDocuments(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", "Maximum file size is 5MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedType || !selectedFile) {
      toast.error("Validation Error", "Please select document type and file");
      return;
    }

    try {
      setUploading(true);

      // Create FormData to send file
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("documentType", selectedType);

      const res = await fetch(`/api/students/${studentId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await res.json();
      
      // Show success alert with document details
      toast.success(
        `${selectedType} Uploaded`,
        `Document "${selectedFile.name}" has been uploaded successfully and is pending verification.`
      );
      
      setShowUploadModal(false);
      setSelectedType("");
      setSelectedFile(null);
      await loadDocuments();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Please try again";
      toast.error(
        "Upload Failed",
        `${selectedType}: ${errorMsg}`
      );
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      // Note: Delete endpoint not yet implemented in API
      // This is a placeholder for future implementation
      toast.info("Delete", "Document deletion not yet available");
    } catch (error) {
      toast.error("Delete failed", "Please try again");
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-400">Loading your documents...</div>;
  }

  const verifiedCount = documents.filter((d) => d.status === "VERIFIED").length;
  const pendingCount = documents.filter((d) => d.status === "PENDING").length;
  const rejectedCount = documents.filter((d) => d.status === "REJECTED").length;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={easeOut}>
        <h1 className="text-2xl font-bold text-[#444] tracking-tight">My Documents</h1>
        <p className="mt-1 text-sm text-gray-400">Upload and manage your admission documents.</p>
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
              <p className="text-xs text-gray-400 uppercase tracking-wide">Verified</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{verifiedCount}</p>
            </div>
            <CheckCircle2 size={24} className="text-emerald-600" />
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
            </div>
            <AlertCircle size={24} className="text-yellow-600" />
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Rejected</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{rejectedCount}</p>
            </div>
            <AlertCircle size={24} className="text-red-600" />
          </div>
        </motion.div>
      </motion.div>

      {/* Upload Button */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...easeOut, delay: 0.2 }}>
        <Button
          icon={<Upload size={16} />}
          onClick={() => setShowUploadModal(true)}
          className="w-full sm:w-auto"
        >
          Upload Document
        </Button>
      </motion.div>

      {/* Upload Modal */}
      {showUploadModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#444] mb-4">Upload Document</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select document type...</option>
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <FileText size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : "Click to select or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Max 5MB • PDF, JPG, PNG, DOC</p>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedType("");
                    setSelectedFile(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  loading={uploading}
                  disabled={!selectedType || !selectedFile}
                  className="flex-1"
                >
                  Upload
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Documents List */}
      <Card title="Your Documents" subtitle="All uploaded documents" noPadding delay={0.25}>
        {documents.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText size={48} className="mx-auto mb-3 opacity-50" />
            <p>No documents uploaded yet</p>
            <p className="text-sm mt-1">Upload required documents to proceed with admission</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Type", "File Name", "Uploaded", "Status", "Action"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide ${
                        i === 4 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {documents.map((doc, i) => {
                  const cfg = statusConfig[doc.status];
                  return (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...easeOut, delay: 0.3 + i * 0.07 }}
                      whileHover={{ backgroundColor: "rgba(249,250,251,0.8)" }}
                      className="transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-[#444]">{doc.documentType}</td>
                      <td className="px-6 py-4 text-gray-600">{doc.fileName}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={cfg.variant} dot>
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
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
                            title="Download document"
                          >
                            <Download size={12} />
                          </motion.button>
                          {doc.status === "REJECTED" && (
                            <motion.button
                              onClick={() => handleDelete(doc.id)}
                              className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                              whileHover={{ scale: 1.05 }}
                            >
                              <Trash2 size={12} />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Rejection Reasons */}
      {rejectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeOut, delay: 0.4 }}
          className="bg-red-50 border border-red-100 rounded-xl p-4"
        >
          <h3 className="font-semibold text-red-700 mb-3">Rejected Documents</h3>
          <div className="space-y-2">
            {documents
              .filter((d) => d.status === "REJECTED")
              .map((doc) => (
                <div key={doc.id} className="text-sm text-red-600">
                  <p className="font-medium">{doc.documentType}</p>
                  {doc.rejectionReason && <p className="text-xs text-red-500 mt-1">{doc.rejectionReason}</p>}
                </div>
              ))}
          </div>
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...easeOut, delay: 0.5 }}
        className="text-xs text-gray-400 text-center"
      >
        For document upload issues, contact{" "}
        <a href="mailto:admissions@kalnet.edu" className="text-primary hover:underline">
          admissions@kalnet.edu
        </a>
      </motion.p>
    </div>
  );
}
