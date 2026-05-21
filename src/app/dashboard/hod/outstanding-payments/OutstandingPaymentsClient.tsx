"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Plus, Search, Filter, DollarSign, CheckCircle2, Clock } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { staggerContainer, staggerItem, easeOut } from "@/components/motion/MotionConfig";

interface OutstandingPayment {
  id: number;
  studentId: number;
  studentName?: string;
  studentEmail?: string;
  amount: number;
  paidAmount?: number;
  remainingAmount?: number;
  reason: string;
  status: string;
  dueDate: string;
  createdAt: string;
}

export default function OutstandingPaymentsClient() {
  const [payments, setPayments] = useState<OutstandingPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<OutstandingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "PAID" | "OVERDUE">("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ studentId: "", amount: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  // Fetch outstanding payments
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/hod/fees/outstanding?limit=100");

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const data = await response.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching payments:", err);
      showError("Failed to load outstanding payments");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPayments();
  }, []);

  // Auto-refresh every 10 seconds to catch payment updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPayments();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter payments
  useEffect(() => {
    let filtered = payments;

    // Filter by status
    if (filterStatus !== "ALL") {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.reason?.toLowerCase().includes(term) ||
          p.studentName?.toLowerCase().includes(term) ||
          p.studentEmail?.toLowerCase().includes(term)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredPayments(filtered);
  }, [payments, searchTerm, filterStatus]);

  // Calculate stats
  const stats = {
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    pendingPayments: payments.filter((p) => p.status === "PENDING").length,
    paidPayments: payments.filter((p) => p.status === "PAID").length,
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle create payment
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentId || !formData.amount || !formData.reason) {
      showError("Please fill all fields");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/payments/outstanding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: Number(formData.studentId),
          amount: Number(formData.amount),
          reason: formData.reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment");
      }

      showSuccess("Outstanding payment created successfully");
      setFormData({ studentId: "", amount: "", reason: "" });
      setShowCreateModal(false);

      // Refresh payments immediately
      await fetchPayments();
    } catch (err) {
      console.error("Error creating payment:", err);
      showError("Failed to create outstanding payment");
    } finally {
      setSubmitting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge variant="success" dot>Paid</Badge>;
      case "PENDING":
        return <Badge variant="warning" dot>Pending</Badge>;
      case "OVERDUE":
        return <Badge variant="danger" dot>Overdue</Badge>;
      default:
        return <Badge variant="info" dot>{status}</Badge>;
    }
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
              <p className="text-xs text-gray-500 font-medium">Total Outstanding</p>
              <p className="text-2xl font-bold text-[#444] mt-1">{stats.totalPayments}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <DollarSign size={18} className="text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="bg-white rounded-2xl border border-gray-100 shadow-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Amount</p>
              <p className="text-2xl font-bold text-[#444] mt-1">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-600" />
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
              <p className="text-2xl font-bold text-amber-500 mt-1">{stats.pendingPayments}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock size={18} className="text-amber-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="bg-white rounded-2xl border border-gray-100 shadow-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Paid</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.paidPayments}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Outstanding Payments */}
      <Card
        title="Outstanding Payments"
        subtitle="Create and manage miscellaneous fees"
        delay={0.1}
        action={
          <Button
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            Create
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reason or student..."
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
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>

          {/* Payments Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="text-sm text-gray-500">Loading outstanding payments...</p>
              </div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <DollarSign size={20} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No outstanding payments found</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Student</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Reason</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Remaining</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Due Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment, index) => (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...easeOut, delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-700">{payment.studentName || "N/A"}</p>
                          <p className="text-xs text-gray-500">{payment.studentEmail || "N/A"}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{payment.reason}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-700">{formatCurrency(payment.amount)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-red-600">
                          {formatCurrency(payment.remainingAmount || payment.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">{formatDate(payment.dueDate)}</span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(payment.status)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Results count */}
          {!loading && filteredPayments.length > 0 && (
            <div className="text-xs text-gray-500 text-center pt-2">
              Showing {filteredPayments.length} of {payments.length} outstanding payments
            </div>
          )}
        </div>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-[#444] mb-4">Create Outstanding Payment</h3>

            <form onSubmit={handleCreatePayment} className="space-y-4">
              {/* Student ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input
                  type="number"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="Enter student ID"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., Library Fine, Lab Fee"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  type="submit"
                  loading={submitting}
                >
                  Create
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0.2 }}
        className="bg-blue-50 border border-blue-200 rounded-2xl p-4"
      >
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <AlertCircle size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Outstanding Payments</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Create miscellaneous fees for students (library fines, lab fees, etc.). Students will receive payment links to settle these amounts.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
