"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { easeOut } from "@/components/motion/MotionConfig";

function AdmissionStatusContent() {
  const searchParams = useSearchParams();
  const refFromUrl = searchParams.get("ref");

  const [referenceNumber, setReferenceNumber] = useState(refFromUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [admission, setAdmission] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAdmission(null);
    setSearched(true);

    if (!referenceNumber.trim()) {
      setError("Please enter a reference number");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admissions/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceNumber: referenceNumber.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Admission not found");
        return;
      }

      setAdmission(data);
    } catch (err) {
      setError("Error fetching admission status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-8 w-8 text-amber-500" />;
      case "APPROVED":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <AlertCircle className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 border-amber-200";
      case "APPROVED":
        return "bg-green-50 border-green-200";
      case "REJECTED":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Under Review";
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Not Approved";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex flex-col p-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-100/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg mx-auto mb-6">
        <Link
          href="/admissions/enquire"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors font-medium group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Enquiry
        </Link>
      </div>

      <div className="relative w-full max-w-lg mx-auto flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeOut}
        >
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-primary items-center justify-center shadow-glow-lg mb-4">
              <Clock size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#444] tracking-tight">
              Track Your Application
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Enter your reference number to check your admission status
            </p>
          </div>

          <Card title="Application Status" noPadding>
            <div className="p-8">
              <form onSubmit={handleSearch} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., ENQ-202605-AB12"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You received this number when you submitted your enquiry
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={loading}
                  disabled={!referenceNumber.trim()}
                >
                  {loading ? "Searching..." : "Check Status"}
                </Button>
              </form>

              {admission && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={easeOut}
                  className="space-y-4"
                >
                  <div className={`border rounded-xl p-6 ${getStatusColor(admission.status)}`}>
                    <div className="flex items-center gap-4 mb-4">
                      {getStatusIcon(admission.status)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {getStatusText(admission.status)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {admission.status === "PENDING" &&
                            "Your application is being reviewed"}
                          {admission.status === "APPROVED" &&
                            "Congratulations! You have been admitted"}
                          {admission.status === "REJECTED" &&
                            "Your application was not approved"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">
                        Reference Number
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {admission.referenceNumber}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Student Name
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {admission.studentName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Class Applied
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {admission.classApplied}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">
                        Submitted Date
                      </p>
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(admission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {admission.status === "APPROVED" && admission.approvedAt && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Approved Date
                        </p>
                        <p className="text-sm font-semibold text-green-600">
                          {new Date(admission.approvedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {admission.status === "REJECTED" && admission.rejectionReason && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Reason
                        </p>
                        <p className="text-sm text-gray-800">
                          {admission.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {admission.status === "APPROVED" && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-sm text-green-800 mb-3">
                        Your admission has been approved! Check your email for login
                        credentials and next steps.
                      </p>
                      <Link
                        href="/login"
                        className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Login to Portal
                      </Link>
                    </div>
                  )}

                  {admission.status === "PENDING" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm text-amber-800">
                        Your application is under review. We will notify you via email
                        once a decision has been made. This usually takes 2-3 business
                        days.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {searched && !admission && !loading && !error && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No application found</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        <p className="mt-4 text-center text-xs text-gray-400">
          © 2026 KALNET School Management System
        </p>
      </div>
    </div>
  );
}

export default function AdmissionStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50">Loading...</div>}>
      <AdmissionStatusContent />
    </Suspense>
  );
}
