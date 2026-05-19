"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Input, { Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { CheckCircle2, Send, CalendarDays, Tag, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { easeOut } from "@/components/motion/MotionConfig";
import type { LeaveBalance } from "@/lib/leaveBalance";

const leaveTypes = ["Medical / Health", "Family Function", "Personal Work", "Bereavement", "Academic Event", "Other"];

interface Props {
  balance: LeaveBalance;
}

export default function LeaveRequestForm({ balance }: Props) {
  const toast = useToast();
  const [form, setForm]       = useState({ type: "", from: "", to: "", reason: "" });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [isStaff, setIsStaff] = useState(false);

  // Detect if user is staff by checking the current URL or session
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const session = await response.json();
          const role = session?.user?.role;
          setIsStaff(role === "CLASS_TEACHER" || role === "HOD");
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      }
    };
    checkUserRole();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.type)   e.type   = "Please select a leave type";
    if (!form.from)   e.from   = "Start date is required";
    if (!form.to)     e.to     = "End date is required";
    if (!form.reason) e.reason = "Please provide a reason";
    if (form.from && form.to && form.from > form.to) e.to = "End date must be after start date";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      // Use different endpoint based on user role
      const endpoint = isStaff ? "/api/staff/leave/request" : "/api/leave";
      
      const response = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          type: form.type,
          from: form.from,
          to: form.to,
          reason: form.reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422) {
          setErrors({ submit: data.error || data.errors?.reason || "Validation failed" });
        } else {
          setErrors({ submit: "Failed to submit request. Please try again." });
        }
        setLoading(false);
        return;
      }

      const formattedId = `LR-${data.id.toString().padStart(4, "0")}`;
      setRequestId(formattedId);
      setSubmitted(true);
      toast.success("Leave request submitted!", `Ref ID: ${formattedId}`);
    } catch (error) {
      console.error("Submit error:", error);
      setErrors({ submit: "Failed to submit request. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 text-center"
        >
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-[#444]">Request Submitted!</h3>
          <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">
            Your leave request has been submitted with ID{" "}
            <span className="font-mono font-bold text-primary">{requestId}</span>.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl text-sm text-emerald-700 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Awaiting approval
          </div>
          <div className="mt-6">
            <Button variant="outline" size="sm" onClick={() => { setSubmitted(false); setForm({ type: "", from: "", to: "", reason: "" }); }}>
              Submit another request
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={easeOut}
          className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#444]">New Leave Request</h3>
              <p className="text-xs text-gray-400 mt-0.5">Fill in the details below to submit your request</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={balance.monthlyRemaining === 0 ? "danger" : balance.monthlyRemaining === 1 ? "warning" : "success"} dot>
                {balance.monthlyRemaining}d this month
              </Badge>
              <Badge variant={balance.yearlyRemaining <= 2 ? "danger" : balance.yearlyRemaining <= 5 ? "warning" : "success"} dot>
                {balance.yearlyRemaining}d this year
              </Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errors.submit && (
              <div className="flex items-start gap-2 px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {errors.submit}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#444]">Leave Type</label>
              <div className="relative">
                <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className={`w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-[#444] transition-all duration-200 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.type ? "border-red-300" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <option value="">Select leave type...</option>
                  {leaveTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {errors.type && <p className="text-xs text-red-500">{errors.type}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="From Date" type="date" value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                error={errors.from} icon={<CalendarDays size={15} />} />
              <Input label="To Date" type="date" value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                error={errors.to} icon={<CalendarDays size={15} />} />
            </div>

            <Textarea label="Reason" placeholder="Briefly describe the reason for your leave..."
              rows={3} value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              error={errors.reason} />

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-gray-400">Requests are reviewed within 24 hours</p>
              <Button
                type="submit"
                loading={loading}
                disabled={balance.monthlyRemaining === 0 || balance.yearlyRemaining === 0}
                icon={<Send size={14} />}
              >
                Submit Request
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
