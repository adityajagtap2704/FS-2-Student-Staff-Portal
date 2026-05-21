"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Clock, AlertCircle, FileText, Mail } from "lucide-react";

export default function ApplicationStatusPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [applicationData, setApplicationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      const fetchApplicationStatus = async () => {
        try {
          const res = await fetch("/api/admissions/enquiry-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: (session?.user as any)?.email }),
          });

          if (res.ok) {
            const data = await res.json();
            setApplicationData(data);
          }
        } catch (error) {
          console.error("Error fetching application status:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchApplicationStatus();
    }
  }, [status, router, session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your application status...</p>
        </div>
      </div>
    );
  }

  if (!applicationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Application Not Found</h2>
          <p className="text-gray-600">We couldn&apos;t find your application. Please contact the school office.</p>
        </div>
      </div>
    );
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "INITIAL_ENTRY":
        return <Clock className="h-6 w-6 text-blue-500" />;
      case "APPLICATION":
        return <FileText className="h-6 w-6 text-yellow-500" />;
      case "APPROVED":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "REJECTED":
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "INITIAL_ENTRY":
        return "bg-blue-50 border-blue-200";
      case "APPLICATION":
        return "bg-yellow-50 border-yellow-200";
      case "APPROVED":
        return "bg-green-50 border-green-200";
      case "REJECTED":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Application Status</h1>
          <p className="text-gray-600">Track your admission application</p>
        </motion.div>

        {/* Enquiry Number */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enquiry Number</p>
              <p className="text-2xl font-bold text-primary">{applicationData.enquiryNumber}</p>
            </div>
            <Mail className="h-8 w-8 text-primary opacity-20" />
          </div>
        </motion.div>

        {/* Current Stage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-lg shadow-md p-6 mb-6 border-2 ${getStageColor(applicationData.stage)}`}
        >
          <div className="flex items-center gap-4 mb-4">
            {getStageIcon(applicationData.stage)}
            <div>
              <h2 className="text-xl font-bold text-gray-800">{applicationData.stageDescription}</h2>
              <p className="text-sm text-gray-600">Status: {applicationData.status}</p>
            </div>
          </div>
        </motion.div>

        {/* Application Details */}
        {applicationData.admission && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6 mb-6"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Application Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Reference Number:</span>
                <span className="font-semibold text-gray-800">{applicationData.admission.referenceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Class Applied:</span>
                <span className="font-semibold text-gray-800">Class {applicationData.admission.classApplied}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Application Status:</span>
                <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                  applicationData.admission.status === "APPROVED"
                    ? "bg-green-100 text-green-800"
                    : applicationData.admission.status === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {applicationData.admission.status}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">Timeline</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <div className="w-0.5 h-12 bg-gray-300"></div>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Account Created</p>
                <p className="text-sm text-gray-600">
                  {new Date(applicationData.timeline.accountCreated).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>

            {applicationData.timeline.applicationSubmitted && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="w-0.5 h-12 bg-gray-300"></div>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Application Submitted</p>
                  <p className="text-sm text-gray-600">
                    {new Date(applicationData.timeline.applicationSubmitted).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            )}

            {applicationData.timeline.approvedAt && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Admission Approved</p>
                  <p className="text-sm text-gray-600">
                    {new Date(applicationData.timeline.approvedAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Rejection Reason */}
        {applicationData.admission?.rejectionReason && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mt-6"
          >
            <h3 className="text-lg font-bold text-red-800 mb-2">Rejection Reason</h3>
            <p className="text-red-700">{applicationData.admission.rejectionReason}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
