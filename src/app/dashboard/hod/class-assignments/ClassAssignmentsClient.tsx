"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Filter, BookOpen, CheckCircle2, AlertCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { staggerContainer, staggerItem, easeOut } from "@/components/motion/MotionConfig";

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  assignedClass?: string;
  isActive: boolean;
  createdAt: string;
  approvalStatus: string;
  studentCount: number;
  pendingLeaveCount: number;
  isOnLeave?: boolean;
  substituteId?: number | null;
  substituteName?: string | null;
  isFreeRightNow?: boolean;
}

export default function ClassAssignmentsClient() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "APPROVED" | "PENDING">("ALL");
  const [filterClass, setFilterClass] = useState<"ALL" | string>("ALL");
  const [selectedSubstitutes, setSelectedSubstitutes] = useState<Record<number, string>>({});
  const [assigningSubId, setAssigningSubId] = useState<number | null>(null);
  const { error: showError, success: showSuccess } = useToast();

  // Fetch staff
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/hod/staff");

        if (!response.ok) {
          throw new Error("Failed to fetch staff");
        }

        const data = await response.json();
        setStaff(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching staff:", err);
        showError("Failed to load staff assignments");
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [showError]);

  const handleAssignSubstitute = async (absentStaffId: number, classEnrolled: string) => {
    const substituteStaffId = selectedSubstitutes[absentStaffId];
    if (!substituteStaffId) {
      showError("Please select a substitute staff member");
      return;
    }

    try {
      setAssigningSubId(absentStaffId);
      const res = await fetch("/api/hod/substitute-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          absentStaffId,
          substituteStaffId: parseInt(substituteStaffId),
          classEnrolled,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to assign substitute");
      }

      if (showSuccess) {
        showSuccess("Substitute assigned successfully");
      } else {
        alert("Substitute assigned successfully");
      }
      
      // Update local state instead of refetching everything to be faster
      const substitute = staff.find(s => s.id === parseInt(substituteStaffId));
      if (substitute) {
        setStaff(prev => prev.map(s => 
          s.id === absentStaffId 
            ? { ...s, substituteId: substitute.id, substituteName: substitute.name }
            : s
        ));
      }
      
    } catch (err: any) {
      console.error("Error assigning substitute:", err);
      showError(err.message || "Failed to assign substitute");
    } finally {
      setAssigningSubId(null);
    }
  };

  const handleRemoveSubstitute = async (absentStaffId: number) => {
    try {
      setAssigningSubId(absentStaffId);
      const res = await fetch(`/api/hod/substitute-assignments?absentStaffId=${absentStaffId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to remove substitute");
      }

      if (showSuccess) {
        showSuccess("Substitute removed successfully");
      } else {
        alert("Substitute removed successfully");
      }
      
      setStaff(prev => prev.map(s => 
        s.id === absentStaffId 
          ? { ...s, substituteId: null, substituteName: null }
          : s
      ));
      
    } catch (err: any) {
      console.error("Error removing substitute:", err);
      showError(err.message || "Failed to remove substitute");
    } finally {
      setAssigningSubId(null);
    }
  };

  // Filter staff
  useEffect(() => {
    let filtered = staff;

    // Filter by status
    if (filterStatus !== "ALL") {
      filtered = filtered.filter((s) => s.approvalStatus === filterStatus);
    }

    // Filter by class
    if (filterClass !== "ALL") {
      filtered = filtered.filter((s) => s.assignedClass === filterClass);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term) ||
          s.assignedClass?.toLowerCase().includes(term)
      );
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredStaff(filtered);
  }, [staff, searchTerm, filterStatus, filterClass]);

  // Get unique classes
  const classes = Array.from(new Set(staff.filter((s) => s.assignedClass).map((s) => s.assignedClass)));
  
  // Available substitutes sorted by availability
  const availableSubstitutes = staff.filter(s => s.approvalStatus === 'APPROVED' && !s.isOnLeave);
  const sortedAvailableSubstitutes = [...availableSubstitutes].sort((a, b) => {
    if (a.isFreeRightNow && !b.isFreeRightNow) return -1;
    if (!a.isFreeRightNow && b.isFreeRightNow) return 1;
    return a.name.localeCompare(b.name);
  });

  // Calculate stats
  const stats = {
    totalStaff: staff.length,
    approvedStaff: staff.filter((s) => s.approvalStatus === "APPROVED").length,
    pendingStaff: staff.filter((s) => s.approvalStatus === "PENDING").length,
    assignedClasses: classes.length,
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div
          variants={staggerItem}
          className="bg-white rounded-2xl border border-gray-100 shadow-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Staff</p>
              <p className="text-2xl font-bold text-[#444] mt-1">{stats.totalStaff}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="bg-white rounded-2xl border border-gray-100 shadow-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Approved</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.approvedStaff}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="bg-white rounded-2xl border border-gray-100 shadow-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Pending</p>
              <p className="text-2xl font-bold text-amber-500 mt-1">{stats.pendingStaff}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertCircle size={18} className="text-amber-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="bg-white rounded-2xl border border-gray-100 shadow-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Classes</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.assignedClasses}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <BookOpen size={18} className="text-purple-600" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Staff Assignments */}
      <Card title="Staff Class Assignments" subtitle="View staff members and their assigned classes" delay={0.1}>
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
            </select>

            {/* Class Filter */}
            {classes.length > 0 && (
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
              >
                <option value="ALL">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Staff Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="text-sm text-gray-500">Loading staff assignments...</p>
              </div>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Users size={20} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No staff members found</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...easeOut, delay: index * 0.05 }}
                  className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-card transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-700 truncate">{member.name}</h4>
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    </div>
                    <Badge
                      variant={member.approvalStatus === "APPROVED" ? "success" : "warning"}
                      dot
                    >
                      {member.approvalStatus}
                    </Badge>
                  </div>

                  {/* Class Assignment */}
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-600 font-medium">Assigned Class</p>
                    <p className="text-sm font-semibold text-blue-600 mt-1">
                      {member.assignedClass || "Not Assigned"}
                    </p>
                  </div>

                  {/* Leave & Substitute UI */}
                  {member.assignedClass && (
                    <div className={`rounded-lg p-3 mb-3 border ${member.isOnLeave ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-200'}`}>
                      {member.isOnLeave ? (
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle size={14} className="text-amber-600" />
                          <span className="text-xs font-semibold text-amber-700">Staff On Leave</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-2">
                          <Users size={14} className="text-gray-500" />
                          <span className="text-xs font-semibold text-gray-600">Temporary Cover / Substitute</span>
                        </div>
                      )}
                      
                      {member.substituteName ? (
                        <div className="flex items-center justify-between mt-1">
                          <div>
                            <p className={`text-xs mb-1 ${member.isOnLeave ? 'text-amber-700/80' : 'text-gray-500'}`}>Substitute Assigned:</p>
                            <p className={`text-sm font-medium ${member.isOnLeave ? 'text-amber-800' : 'text-gray-700'}`}>{member.substituteName}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveSubstitute(member.id)}
                            disabled={assigningSubId === member.id}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 mt-2">
                          <select 
                            className={`w-full text-xs p-2 rounded border bg-white focus:outline-none focus:ring-1 ${member.isOnLeave ? 'border-amber-200 focus:ring-amber-500' : 'border-gray-200 focus:ring-blue-500'}`}
                            value={selectedSubstitutes[member.id] || ""}
                            onChange={(e) => setSelectedSubstitutes(prev => ({ ...prev, [member.id]: e.target.value }))}
                          >
                            <option value="">Select Substitute...</option>
                            {sortedAvailableSubstitutes.filter(s => s.id !== member.id).map(sub => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name} {sub.isFreeRightNow ? "(Free Now)" : ""}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignSubstitute(member.id, member.assignedClass!)}
                            disabled={assigningSubId === member.id || !selectedSubstitutes[member.id]}
                            className={`w-full py-1.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs rounded-md transition-colors font-medium flex items-center justify-center gap-1 ${member.isOnLeave ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-800 hover:bg-gray-900'}`}
                          >
                            {assigningSubId === member.id ? (
                               <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            ) : "Assign Substitute"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-600">Students</p>
                      <p className="text-lg font-bold text-gray-700 mt-0.5">{member.studentCount}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-600">Pending Leave</p>
                      <p className="text-lg font-bold text-gray-700 mt-0.5">{member.pendingLeaveCount}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Joined: {formatDate(member.createdAt)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Results count */}
          {!loading && filteredStaff.length > 0 && (
            <div className="text-xs text-gray-500 text-center pt-2">
              Showing {filteredStaff.length} of {staff.length} staff members
            </div>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0.2 }}
        className="bg-blue-50 border border-blue-200 rounded-2xl p-4"
      >
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <BookOpen size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Class Assignments</p>
            <p className="text-xs text-blue-700 mt-0.5">
              View all staff members and their assigned classes. Use filters to find specific staff or classes.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
