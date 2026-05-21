"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Users, Edit2, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  assignedClass: string | null;
  isActive: boolean;
  createdAt: string;
  approvalStatus?: string;
  studentCount?: number;
}

export default function HODStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newClass, setNewClass] = useState("");

  const CLASSES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hod/staff");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch staff");
        return;
      }

      setStaff(data.staff || []);
    } catch (err) {
      setError("Error fetching staff");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (staffId: number, assignClass: string | null) => {
    try {
      const res = await fetch(`/api/hod/staff/${staffId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedClass: null }), // Always approve without class
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to approve staff");
        return;
      }

      setError("");
      fetchStaff();
      alert("✅ Staff approved successfully!\n\nYou can assign a class later using the reassignment feature in the Approved tab.");
    } catch (err) {
      setError("Error approving staff");
      console.error(err);
    }
  };

  const handleReject = async (staffId: number) => {
    try {
      const res = await fetch(`/api/hod/staff/${staffId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reject staff");
        return;
      }

      setError("");
      fetchStaff();
    } catch (err) {
      setError("Error rejecting staff");
      console.error(err);
    }
  };

  const handleReassignClass = async () => {
    if (!selectedStaff) return;

    try {
      const res = await fetch(`/api/hod/staff/${selectedStaff.id}/reassign-class`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newClass: newClass || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle class conflict - offer swap option
        if (data.code === "CLASS_CONFLICT" && data.existingTeacherId) {
          const shouldSwap = confirm(
            `⚠️ CLASS CONFLICT\n\n` +
            `${data.error}\n\n` +
            `Current Assignments:\n` +
            `• ${data.currentTeacherName} → ${data.currentTeacherClass || "Unassigned"}\n` +
            `• ${data.existingTeacherName} → ${data.existingTeacherClass}\n\n` +
            `${data.suggestion}\n\n` +
            `Click OK to SWAP their classes, or Cancel to go back.`
          );

          if (shouldSwap) {
            // Perform swap
            const swapRes = await fetch(`/api/hod/staff/${selectedStaff.id}/reassign-class`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                newClass: newClass || null,
                swapWithStaffId: data.existingTeacherId 
              }),
            });

            const swapData = await swapRes.json();

            if (!swapRes.ok) {
              setError(swapData.error || "Failed to swap classes");
              return;
            }

            setError("");
            setShowModal(false);
            setNewClass("");
            setSelectedStaff(null);
            fetchStaff();
            alert(`✅ Classes swapped successfully!\n\n${swapData.message}`);
            return;
          }
        }

        setError(data.error || "Failed to reassign class");
        return;
      }

      setError("");
      setShowModal(false);
      setNewClass("");
      setSelectedStaff(null);
      fetchStaff();
      alert("✅ Class reassigned successfully!");
    } catch (err) {
      setError("Error reassigning class");
      console.error(err);
    }
  };

<<<<<<< HEAD
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "CLASS_TEACHER":
        return "Class Teacher";
      case "NON_TEACHING_STAFF":
        return "Non-Teaching Staff";
      default:
        return role;
    }
  };

  const pendingStaff = staff.filter((s) => s.approvalStatus === "PENDING");
  const approvedStaff = staff.filter((s) => s.approvalStatus === "APPROVED");

  // Separate class teachers and non-teaching staff
  const approvedClassTeachers = approvedStaff.filter((s) => s.role === "CLASS_TEACHER");
  const approvedNonTeachingStaff = approvedStaff.filter((s) => s.role === "NON_TEACHING_STAFF");

=======
  const pendingStaff = staff.filter((s) => s.approvalStatus === "PENDING");
  const approvedStaff = staff.filter((s) => s.approvalStatus === "APPROVED");

>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
  const displayStaff = activeTab === "pending" ? pendingStaff : approvedStaff;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Management</h1>
          <p className="text-gray-600">Approve, reject, and manage staff registrations</p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600"
          >
            {error}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "pending"
                ? "bg-primary text-white shadow-glow"
                : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
            }`}
          >
            <Clock size={18} className="inline mr-2" />
            Pending ({pendingStaff.length})
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "approved"
                ? "bg-primary text-white shadow-glow"
                : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
            }`}
          >
            <CheckCircle2 size={18} className="inline mr-2" />
            Approved ({approvedStaff.length})
          </button>
        </div>

        {/* Staff List */}
        <div className="space-y-4">
          {displayStaff.length === 0 ? (
            <Card noPadding>
              <div className="p-8 text-center text-gray-500">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>No {activeTab} staff registrations</p>
              </div>
            </Card>
          ) : (
            displayStaff.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card noPadding>
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{member.email}</p>
<<<<<<< HEAD
                        <div className="flex gap-4 mt-3 flex-wrap">
                          <span className="inline-block px-3 py-1 bg-primary-50 text-primary text-xs font-semibold rounded-full">
                            {getRoleLabel(member.role)}
                          </span>
                          {member.role === "CLASS_TEACHER" && member.assignedClass && (
=======
                        <div className="flex gap-4 mt-3">
                          <span className="inline-block px-3 py-1 bg-primary-50 text-primary text-xs font-semibold rounded-full">
                            {member.role === "CLASS_TEACHER" ? "Class Teacher" : "HOD"}
                          </span>
                          {member.assignedClass && (
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
                            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
                              {member.assignedClass}
                            </span>
                          )}
                          {member.studentCount !== undefined && (
                            <span className="inline-block px-3 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full">
                              {member.studentCount} students
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 ml-4">
                        {activeTab === "pending" ? (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleApprove(member.id, null)}
                              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle2 size={20} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleReject(member.id)}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              title="Reject"
                            >
                              <XCircle size={20} />
                            </motion.button>
                          </>
                        ) : (
<<<<<<< HEAD
                          member.role === "CLASS_TEACHER" && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedStaff(member);
                                setNewClass(member.assignedClass || "");
                                setShowModal(true);
                              }}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              title="Reassign Class"
                            >
                              <Edit2 size={20} />
                            </motion.button>
                          )
=======
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedStaff(member);
                              setNewClass(member.assignedClass || "");
                              setShowModal(true);
                            }}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Reassign Class"
                          >
                            <Edit2 size={20} />
                          </motion.button>
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Reassign Modal */}
      {showModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reassign Class</h2>
            <p className="text-sm text-gray-600 mb-4">
              Reassigning <strong>{selectedStaff.name}</strong> to a new class
            </p>

            {/* Current assignment info */}
            {selectedStaff.assignedClass && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-gray-600">Current Assignment:</p>
                <p className="text-sm font-semibold text-blue-600">{selectedStaff.assignedClass}</p>
              </div>
            )}

            {!selectedStaff.assignedClass && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-gray-600">Status:</p>
                <p className="text-sm font-semibold text-amber-600">Not yet assigned to any class</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select New Class</label>
              <select
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {/* Show "None" option only for newly approved staff (no current class) */}
                {!selectedStaff.assignedClass && (
                  <option value="">None (Unassign)</option>
                )}
                {CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
              
              {/* Show note for already assigned staff */}
              {selectedStaff.assignedClass && (
                <p className="mt-2 text-xs text-gray-500">
                  💡 <strong>Note:</strong> Students in the old class will remain in their current class. Only the teacher&apos;s assignment changes.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedStaff(null);
                  setNewClass("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReassignClass}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Reassign
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
