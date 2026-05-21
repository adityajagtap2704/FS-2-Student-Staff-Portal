"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Filter, Search, Calendar, DollarSign, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { staggerContainer, staggerItem, easeOut } from "@/components/motion/MotionConfig";

interface Payment {
  feeId: number;
  studentId: number;
  studentName: string;
  classEnrolled: string;
  term: string;
  amountPaise: number;
  currency: string;
  status: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  receiptNumber: string | null;
  updatedAt: string;
}

interface PaymentsClientProps {
  studentId: number;
}

export default function PaymentsClient({ studentId }: PaymentsClientProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { success, error, info, warning } = useToast();

  // Fetch payments
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/payments?limit=100");
        
        if (!response.ok) {
          throw new Error("Failed to fetch payments");
        }

        const data = await response.json();
        setPayments(data.payments || []);
      } catch (err) {
        console.error("Error fetching payments:", err);
        error("Failed to load payment history");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [error]);

  // Filter payments
  useEffect(() => {
    let filtered = payments;

    // Filter by search term (transaction ID or fee type)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.razorpayPaymentId?.toLowerCase().includes(term) ||
          p.razorpayOrderId?.toLowerCase().includes(term) ||
          p.term?.toLowerCase().includes(term) ||
          p.studentName?.toLowerCase().includes(term)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    setFilteredPayments(filtered);
  }, [payments, searchTerm]);



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
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge variant="success" dot>Paid</Badge>;
      case "FAILED":
        return <Badge variant="danger" dot>Failed</Badge>;
      case "CREATED":
        return <Badge variant="warning" dot>Pending</Badge>;
      default:
        return <Badge variant="info" dot>{status}</Badge>;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle2 size={16} className="text-emerald-600" />;
      case "FAILED":
        return <AlertCircle size={16} className="text-red-500" />;
      case "CREATED":
        return <Clock size={16} className="text-amber-500" />;
      default:
        return <DollarSign size={16} className="text-gray-400" />;
    }
  };

  // Download receipt
  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      if (!payment.razorpayOrderId) {
        warning("Receipt not available for this payment");
        return;
      }

      // Call the receipt API endpoint
      const response = await fetch(`/api/fees/${payment.feeId}/receipt`);
      
      if (!response.ok) {
        warning("Receipt not available yet");
        return;
      }

      const html = await response.text();
      const url = window.URL.createObjectURL(new Blob([html], { type: "text/html" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${payment.razorpayOrderId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      success("Receipt downloaded successfully");
    } catch (err) {
      console.error("Error downloading receipt:", err);
      error("Failed to download receipt");
    }
  };

  return (
    <div className="space-y-5">
      {/* Payment History Card */}
      <Card title="Payment History" subtitle="View all your payments and download receipts" delay={0.1}>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by transaction ID or fee type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          {/* Payments Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="text-sm text-gray-500">Loading payment history...</p>
              </div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <DollarSign size={20} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No payments found</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Fee Term</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment, index) => (
                    <motion.tr
                      key={payment.razorpayOrderId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...easeOut, delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-gray-700">{formatDate(payment.updatedAt)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-700">{payment.term || "N/A"}</p>
                          <p className="text-xs text-gray-500">{payment.studentName || "N/A"}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-700">{formatCurrency(payment.amountPaise / 100)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          {getStatusBadge(payment.status)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDownloadReceipt(payment)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium"
                          title="Download receipt"
                        >
                          <Download size={14} />
                          <span className="hidden sm:inline">Receipt</span>
                        </motion.button>
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
              Showing {filteredPayments.length} of {payments.length} payments
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
            <DollarSign size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Payment History</p>
            <p className="text-xs text-blue-700 mt-0.5">
              All your payments are listed above. Download receipts for your records. If you have any issues, contact the administration.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
