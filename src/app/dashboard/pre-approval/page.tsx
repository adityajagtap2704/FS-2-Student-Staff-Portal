"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { easeOut } from "@/components/motion/MotionConfig";

interface StudentData {
  id: number;
  email: string;
  status: string;
  enquiryNumber: string | null;
  name: string | null;
  phone: string | null;
  parentName: string | null;
  classEnrolled: string | null;
  applicationFeePaid: boolean;
  applicationFeeAmount: number | null;
  documentsUploaded: string | null;
}

export default function PreApprovalDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      fetchStudentData();
    }
  }, [status, session, router]);

  const fetchStudentData = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load profile");
        return;
      }

      setStudent(data.student);
    } catch (err) {
      setError("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card title="Error" noPadding>
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/login")} variant="primary">
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card title="No Data" noPadding>
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">Student data not found</p>
            <Button onClick={() => router.push("/login")} variant="primary">
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRE_APPLICANT":
        return "bg-yellow-100 text-yellow-800";
      case "APPLICANT":
        return "bg-blue-100 text-blue-800";
      case "STUDENT":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PRE_APPLICANT":
        return "Pre-Applicant";
      case "APPLICANT":
        return "Application Submitted";
      case "STUDENT":
        return "Admitted";
      case "REJECTED":
        return "Application Rejected";
      default:
        return status;
    }
  };

  const documents = student.documentsUploaded
    ? JSON.parse(student.documentsUploaded)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeOut}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome to KALNET
          </h1>
          <p className="text-gray-600">
            Track your admission application and complete your enrollment
          </p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeOut}
          className="mb-6"
        >
          <Card title="Application Status" noPadding>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-gray-600 mb-2">Current Status</p>
                  <Badge className={getStatusColor(student.status)}>
                    {getStatusLabel(student.status)}
                  </Badge>
                </div>
                {student.enquiryNumber && (
                  <div className="text-right">
                    <p className="text-gray-600 mb-2">Enquiry Reference</p>
                    <p className="text-2xl font-bold text-primary">
                      {student.enquiryNumber}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              <div className="mt-8">
                <p className="text-sm font-semibold text-gray-700 mb-4">
                  Application Timeline
                </p>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-800">
                        Account Created
                      </p>
                      <p className="text-sm text-gray-600">
                        Email verified and account activated
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center ${
                      student.status !== "PRE_APPLICANT"
                        ? "opacity-100"
                        : "opacity-50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        student.status !== "PRE_APPLICANT"
                          ? "bg-green-500 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {student.status !== "PRE_APPLICANT" ? "✓" : "2"}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-800">
                        Enquiry Submitted
                      </p>
                      <p className="text-sm text-gray-600">
                        Complete your admission enquiry form
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center ${
                      student.status === "STUDENT"
                        ? "opacity-100"
                        : "opacity-50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        student.status === "STUDENT"
                          ? "bg-green-500 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {student.status === "STUDENT" ? "✓" : "3"}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-800">
                        Application Approved
                      </p>
                      <p className="text-sm text-gray-600">
                        Awaiting HOD approval
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeOut, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
        >
          {/* Submit Enquiry */}
          <Card title="Submit Enquiry" noPadding>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                {student.enquiryNumber
                  ? "Update your enquiry information"
                  : "Start your admission process"}
              </p>
              <Button
                onClick={() => router.push("/admissions/enquiry")}
                variant="primary"
                className="w-full"
              >
                {student.enquiryNumber ? "Update Enquiry" : "Submit Enquiry"}
              </Button>
            </div>
          </Card>

          {/* Upload Documents */}
          <Card title="Upload Documents" noPadding>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Upload required documents for your application
              </p>
              <Button
                onClick={() => router.push("/dashboard/pre-approval/documents")}
                variant="primary"
                className="w-full"
              >
                Manage Documents
              </Button>
            </div>
          </Card>

          {/* Application Fee */}
          <Card title="Application Fee" noPadding>
            <div className="p-6">
              <p className="text-gray-600 mb-2">
                {student.applicationFeePaid
                  ? "✓ Fee Paid"
                  : "Fee Payment Required"}
              </p>
              {student.applicationFeeAmount && (
                <p className="text-2xl font-bold text-primary mb-4">
                  ₹{student.applicationFeeAmount}
                </p>
              )}
              <Button
                onClick={() => router.push("/dashboard/pre-approval/fees")}
                variant={student.applicationFeePaid ? "secondary" : "primary"}
                className="w-full"
                disabled={student.applicationFeePaid}
              >
                {student.applicationFeePaid ? "Fee Paid" : "Pay Fee"}
              </Button>
            </div>
          </Card>

          {/* View Status */}
          <Card title="Application Status" noPadding>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Check the current status of your application
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Status:</strong> {getStatusLabel(student.status)}
                </p>
                {student.enquiryNumber && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Reference:</strong> {student.enquiryNumber}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeOut, delay: 0.2 }}
        >
          <Card title="Your Information" noPadding>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium text-gray-800">{student.email}</p>
                </div>
                {student.name && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Student Name</p>
                    <p className="font-medium text-gray-800">{student.name}</p>
                  </div>
                )}
                {student.parentName && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Parent Name</p>
                    <p className="font-medium text-gray-800">
                      {student.parentName}
                    </p>
                  </div>
                )}
                {student.phone && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <p className="font-medium text-gray-800">{student.phone}</p>
                  </div>
                )}
                {student.classEnrolled && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Class Applied</p>
                    <p className="font-medium text-gray-800">
                      {student.classEnrolled}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
