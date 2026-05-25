"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Session } from "next-auth";
import { useSearchParams } from "next/navigation";
import {
  Users, Clock, CreditCard, Megaphone, CheckCircle2,
  XCircle, BookOpen, AlertCircle, Plus, X,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { staggerContainer, easeOut } from "@/components/motion/MotionConfig";

interface Props { session: Session }

type Tab = "overview" | "leave" | "staff" | "fees" | "announcements";

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: "overview",      label: "Overview",      icon: BookOpen    },
  { key: "leave",         label: "Leave",         icon: Clock       },
  { key: "staff",         label: "Staff",         icon: CheckCircle2},
  { key: "fees",          label: "Fees",          icon: CreditCard  },
  { key: "announcements", label: "Announcements", icon: Megaphone   },
];

const CATEGORIES = ["Events", "Exams", "Holidays", "General"] as const;

function leaveColor(remaining: number, limit: number) {
  const pct = remaining / limit;
  if (pct === 0) return "text-red-500";
  if (pct <= 0.5) return "text-amber-500";
  return "text-emerald-500";
}

// ── Staff Leave Section (used inside HOD Leave tab) ───────────────────────────
function StaffLeaveSection() {
  const toast = useToast();
  const [staffLeaves,  setStaffLeaves]  = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState<"ALL"|"PENDING"|"APPROVED"|"REJECTED">("PENDING");
  const [page,         setPage]         = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetch("/api/hod/staff-leave")
      .then(r => r.json())
      .then(d => { setStaffLeaves(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAction = async (id: number, status: "APPROVED" | "REJECTED") => {
    const res = await fetch(`/api/hod/staff-leave/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
    if (res.ok) {
      setStaffLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      toast.success(`Staff leave ${status.toLowerCase()}`, "Status updated.");
    } else {
      toast.error("Action failed", "Please try again.");
    }
  };

  const filtered   = filter === "ALL" ? staffLeaves : staffLeaves.filter(l => l.status === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pendingCount = staffLeaves.filter(l => l.status === "PENDING").length;

  return (
    <Card title="Staff Leave Requests" subtitle="Leave requests from all staff members" noPadding delay={0.2}>
      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2 flex-wrap">
        {(["PENDING","ALL","APPROVED","REJECTED"] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === f ? "bg-primary text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {f}
            {f === "PENDING" && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-400 text-white text-[9px] font-bold px-1 py-0.5 rounded-full">{pendingCount}</span>
            )}
            {f !== "PENDING" && f !== "ALL" && (
              <span className="ml-1 opacity-60">({staffLeaves.filter(l => l.status === f).length})</span>
            )}
            {f === "ALL" && <span className="ml-1 opacity-60">({staffLeaves.length})</span>}
          </button>
        ))}
      </div>

      {loading ? <SkeletonTable rows={3} /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Teacher", "Role", "Type", "From", "To", "Days", "Reason", "Status", "Action"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(lr => {
                  const days = Math.ceil((new Date(lr.toDate).getTime() - new Date(lr.fromDate).getTime()) / 86400000) + 1;
                  return (
                    <tr key={lr.id} className={`hover:bg-gray-50/50 transition-colors ${lr.status === "PENDING" ? "bg-amber-50/30" : ""}`}>
                      <td className="px-4 py-3 font-medium text-[#444] whitespace-nowrap">{lr.staff?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${lr.staff?.role === "NON_TEACHING_STAFF" ? "bg-purple-50 text-purple-600" : "bg-primary-50 text-primary"}`}>
                          {lr.staff?.role === "NON_TEACHING_STAFF" ? "Non-Teaching" : (lr.staff?.assignedClass ?? "—")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{lr.leaveType}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(lr.fromDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(lr.toDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-400">{days}d</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{lr.reason}</td>
                      <td className="px-4 py-3">
                        <Badge variant={lr.status === "APPROVED" ? "success" : lr.status === "REJECTED" ? "danger" : "warning"} dot>
                          {lr.status.charAt(0) + lr.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {lr.status === "PENDING" ? (
                          <div className="flex items-center gap-1.5">
                            <Button size="xs" variant="secondary" onClick={() => handleAction(lr.id, "APPROVED")}>Approve</Button>
                            <Button size="xs" variant="danger"    onClick={() => handleAction(lr.id, "REJECTED")}>Reject</Button>
                          </div>
                        ) : <span className="text-xs text-gray-300">Done</span>}
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No staff leave requests found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-400">{filtered.length} total · Page {page} of {totalPages}</p>
              <div className="flex gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 disabled:opacity-40 hover:bg-gray-200 transition-colors">Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 disabled:opacity-40 hover:bg-gray-200 transition-colors">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default function HodClient({ session }: Props) {
  const toast = useToast();
  const user  = session.user as any;

  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    if (urlTab && ["overview", "leave", "admissions", "staff", "fees", "announcements"].includes(urlTab)) {
      setActiveTab(urlTab);
    } else {
      setActiveTab("overview");
    }
  }, [urlTab]);

  // ── Data states ──────────────────────────────────────────────────────────
  const [leaves,        setLeaves]        = useState<any[]>([]);
  const [admissions,    setAdmissions]    = useState<any[]>([]);
  const [staff,         setStaff]         = useState<any[]>([]);
  const [fees,          setFees]          = useState<{ fees: any[]; summary: Record<string, { count: number; total: number }> } | null>(null);
  const [feesView,      setFeesView]      = useState<{ fees: any[]; summary: any; classes: string[]; activeClass: string } | null>(null);
  const [feeClass,      setFeeClass]      = useState<string>("ALL");
  const [recentAnns,    setRecentAnns]    = useState<any[]>([]);
  const [loadingAnns,   setLoadingAnns]   = useState(true);

  const [loadingL, setLoadingL] = useState(false);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingS, setLoadingS] = useState(false);
  const [loadingF, setLoadingF] = useState(false);
  const [loadingFV, setLoadingFV] = useState(false);

  // ── Track which tabs have been loaded ────────────────────────────────────
  const [loadedTabs, setLoadedTabs] = useState<Set<Tab>>(new Set());

  // ── Staff pending leave count (for badge on Leave tab) ───────────────────
  const [staffPendingCount, setStaffPendingCount] = useState(0);

  // ── Confirmation dialog state ─────────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  // ── Reassign modal state ──────────────────────────────────────────────────
  const [reassignModal, setReassignModal] = useState<{
    open: boolean;
    staff: any | null;
    selectedClass: string;
  }>({ open: false, staff: null, selectedClass: "" });

  const CLASSES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, message, onConfirm });
  };
  const closeConfirm = () => setConfirmDialog(d => ({ ...d, open: false }));

  // ── Announcement form + edit state ───────────────────────────────────────
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [annForm,    setAnnForm]    = useState({ title: "", category: "General", target: "BOTH", description: "", author: user.name ?? "", date: new Date().toISOString().split("T")[0], imageUrl: "" });
  const [annErrors,  setAnnErrors]  = useState<Record<string, string>>({});
  const [annLoading, setAnnLoading] = useState(false);

  // ── Admission filter ─────────────────────────────────────────────────────
  const [admFilter, setAdmFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  // ── Leave sub-tab ─────────────────────────────────────────────────────────
  const [leaveSubTab, setLeaveSubTab] = useState<"student" | "staff" | "admin">("student");

  // ── Student leave filter + pagination ────────────────────────────────────
  const [leaveFilter, setLeaveFilter] = useState<"PENDING"|"ALL"|"APPROVED"|"REJECTED">("PENDING");
  const [leavePage,   setLeavePage]   = useState(1);
  const LEAVE_PAGE_SIZE = 10;

  // ── Admissions pagination ─────────────────────────────────────────────────
  const [admPage, setAdmPage] = useState(1);
  const ADM_PAGE_SIZE = 10;

  // ── Class Teachers Overview pagination ────────────────────────────────────
  const [teachersPage, setTeachersPage] = useState(1);
  const TEACHERS_PAGE_SIZE = 15;

  // ── Lazy load data per tab ───────────────────────────────────────────────
  useEffect(() => {
    if (loadedTabs.has(activeTab)) return;
    setLoadedTabs(prev => new Set([...prev, activeTab]));

    if (activeTab === "overview" || activeTab === "leave") {
      if (!loadedTabs.has("leave") && !loadedTabs.has("overview")) {
        setLoadingL(true);
        fetch("/api/hod/leave")
          .then(r => r.json()).then(d => { setLeaves(Array.isArray(d) ? d : []); setLoadingL(false); })
          .catch(() => setLoadingL(false));
      }
    }
    if (activeTab === "overview") {
      if (!loadedTabs.has("overview")) {
        setLoadingA(true);
        fetch("/api/admissions")
          .then(r => r.json()).then(d => { setAdmissions(Array.isArray(d) ? d : []); setLoadingA(false); })
          .catch(() => setLoadingA(false));
      }
    }
    if (activeTab === "overview" || activeTab === "staff") {
      if (!loadedTabs.has("staff") && !loadedTabs.has("overview")) {
        setLoadingS(true);
        fetch("/api/hod/staff")
          .then(r => r.json()).then(d => { setStaff(Array.isArray(d) ? d : []); setLoadingS(false); })
          .catch(() => setLoadingS(false));
      }
    }
    if (activeTab === "overview") {
      setLoadingF(true);
      fetch("/api/hod/fees")
        .then(r => r.json()).then(d => { setFees(d); setLoadingF(false); })
        .catch(() => setLoadingF(false));
    }
    if (activeTab === "announcements") {
      setLoadingAnns(true);
      fetch("/api/announcements")
        .then(r => r.json()).then(d => { setRecentAnns(Array.isArray(d) ? d : []); setLoadingAnns(false); })
        .catch(() => setLoadingAnns(false));
    }
    if (activeTab === "fees") {
      setLoadingFV(true);
      const q = feeClass && feeClass !== "ALL" ? `?class=${encodeURIComponent(feeClass)}` : "";
      fetch(`/api/hod/fees${q}`)
        .then(r => r.json())
        .then(d => { setFeesView(d); setLoadingFV(false); })
        .catch(() => setLoadingFV(false));
    }
    // Staff pending count for Leave tab badge
    if (activeTab === "leave") {
      fetch("/api/hod/staff-leave")
        .then(r => r.json())
        .then(d => {
          const arr = Array.isArray(d) ? d : [];
          setStaffPendingCount(arr.filter((l: any) => l.status === "PENDING").length);
        })
        .catch(() => {});
    }
  }, [activeTab, loadedTabs]);

  // ── Effect for class filtering in fees tab ───────────────────────────────────
  useEffect(() => {
    if (activeTab === "fees" && loadedTabs.has("fees")) {
      setLoadingFV(true);
      const q = feeClass && feeClass !== "ALL" ? `?class=${encodeURIComponent(feeClass)}` : "";
      fetch(`/api/hod/fees${q}`)
        .then(r => r.json())
        .then(d => { setFeesView(d); setLoadingFV(false); })
        .catch(() => setLoadingFV(false));
    }
  }, [feeClass, activeTab]);

  // ── Initial load for overview ─────────────────────────────────────────────
  useEffect(() => {
    setLoadingL(true); setLoadingA(true); setLoadingS(true); setLoadingF(true);
    setLoadedTabs(new Set(["overview"]));

    fetch("/api/hod/leave")
      .then(r => r.json()).then(d => { setLeaves(Array.isArray(d) ? d : []); setLoadingL(false); })
      .catch(() => setLoadingL(false));
    fetch("/api/admissions")
      .then(r => r.json()).then(d => { setAdmissions(Array.isArray(d) ? d : []); setLoadingA(false); })
      .catch(() => setLoadingA(false));
    fetch("/api/hod/staff")
      .then(r => r.json()).then(d => { setStaff(Array.isArray(d) ? d : []); setLoadingS(false); })
      .catch(() => setLoadingS(false));
    fetch("/api/hod/fees")
      .then(r => r.json()).then(d => { setFees(d); setLoadingF(false); })
      .catch(() => setLoadingF(false));
    fetch("/api/announcements")
      .then(r => r.json()).then(d => { setRecentAnns(Array.isArray(d) ? d : []); setLoadingAnns(false); })
      .catch(() => setLoadingAnns(false));
    fetch("/api/hod/fees")
      .then(r => r.json())
      .then(d => { setFeesView(d); setLoadingFV(false); })
      .catch(() => setLoadingFV(false));
    fetch("/api/hod/staff-leave")
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : [];
        setStaffPendingCount(arr.filter((l: any) => l.status === "PENDING").length);
      })
      .catch(() => {});
  }, []);

  // ── Leave approve / reject ───────────────────────────────────────────────
  const handleLeaveAction = async (id: number, status: "APPROVED" | "REJECTED") => {
    showConfirm(
      `${status === "APPROVED" ? "Approve" : "Reject"} Leave`,
      `Are you sure you want to ${status.toLowerCase()} this leave request? This cannot be undone.`,
      async () => {
        closeConfirm();
        const res = await fetch(`/api/leave/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
          toast.success(`Leave ${status.toLowerCase()}`, "Student has been notified.");
        } else {
          toast.error("Action failed", "Please try again.");
        }
      }
    );
  };

  // ── Admission approve / reject ───────────────────────────────────────────
  const handleAdmissionAction = async (id: number, status: "APPROVED" | "REJECTED") => {
    const adm = admissions.find(a => a.id === id);
    showConfirm(
      `${status === "APPROVED" ? "Approve" : "Reject"} Admission`,
      `${status === "APPROVED"
        ? `Approving will create a student account for "${adm?.studentName}" and send credentials to ${adm?.email}.`
        : `Rejecting will notify "${adm?.studentName}"'s parent at ${adm?.email}.`
      } This cannot be undone.`,
      async () => {
        closeConfirm();
        const res = await fetch(`/api/admissions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          setAdmissions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
          toast.success(`Admission ${status.toLowerCase()}`, status === "APPROVED" ? "Student account created & email sent." : "Rejection email sent.");
        } else {
          const errorData = await res.json();
          const errorMsg = errorData.error || "Please try again.";
          toast.error("Action failed", errorMsg);
        }
      }
    );
  };

  // ── Create / Edit announcement ───────────────────────────────────────────
  const formRef = useRef<HTMLDivElement>(null);

  const openEdit = (ann: any) => {
    setEditingId(ann.id);
    setAnnForm({
      title:       ann.title,
      category:    ann.category,
      target:      ann.target ?? "BOTH",
      description: ann.description,
      author:      ann.author,
      date:        new Date(ann.date).toISOString().split("T")[0],
      imageUrl:    ann.imageUrl ?? "",
    });
    setShowForm(true);
    // Scroll the form into view after it renders
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setAnnForm({ title: "", category: "General", target: "BOTH", description: "", author: user.name ?? "", date: new Date().toISOString().split("T")[0], imageUrl: "" });
    setAnnErrors({});
  };
  const validateAnn = () => {
    const e: Record<string, string> = {};
    if (!annForm.title.trim())       e.title       = "Title is required";
    if (!annForm.description.trim()) e.description = "Description is required";
    if (!annForm.author.trim())      e.author      = "Author is required";
    if (!annForm.date)               e.date        = "Date is required";
    return e;
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateAnn();
    if (Object.keys(errs).length) { setAnnErrors(errs); return; }
    setAnnErrors({});
    setAnnLoading(true);

    const url    = editingId ? `/api/announcements/${editingId}` : "/api/announcements";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(annForm),
    });

    setAnnLoading(false);
    if (res.ok) {
      const saved = await res.json();
      if (editingId) {
        setRecentAnns(prev => prev.map(a => a.id === editingId ? saved : a));
        toast.success("Announcement updated", "Changes are now live.");
      } else {
        setRecentAnns(prev => [saved, ...prev].slice(0, 5));
        toast.success("Announcement created", "It is now visible to all students.");
      }
      resetForm();
    } else {
      toast.error("Failed", "Please try again.");
    }
  };

  // Fix #15 — delete announcement with confirmation
  const handleDeleteAnnouncement = async (id: number) => {
    showConfirm(
      "Delete Announcement",
      "Are you sure you want to delete this announcement? It will be removed for all students immediately.",
      async () => {
        closeConfirm();
        const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
        if (res.ok) {
          setRecentAnns(prev => prev.filter(a => a.id !== id));
          toast.success("Deleted", "Announcement removed.");
        } else {
          toast.error("Failed to delete", "Please try again.");
        }
      }
    );
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalPendingLeaves = staffPendingCount;
  const pendingAdmissions  = admissions.filter(a => a.status === "PENDING").length;
  const filteredAdmissions = admFilter === "ALL" ? admissions : admissions.filter(a => a.status === admFilter);
  const filteredLeaves     = leaveFilter === "ALL" ? leaves : leaves.filter(l => l.status === leaveFilter);
  const leaveTotalPages    = Math.max(1, Math.ceil(filteredLeaves.length / LEAVE_PAGE_SIZE));
  const paginatedLeaves    = filteredLeaves.slice((leavePage - 1) * LEAVE_PAGE_SIZE, leavePage * LEAVE_PAGE_SIZE);
  const admTotalPages      = Math.max(1, Math.ceil(filteredAdmissions.length / ADM_PAGE_SIZE));
  const paginatedAdmissions = filteredAdmissions.slice((admPage - 1) * ADM_PAGE_SIZE, admPage * ADM_PAGE_SIZE);

  const feesSummary = fees?.summary ?? { PAID: { count: 0, total: 0 }, PENDING: { count: 0, total: 0 }, OVERDUE: { count: 0, total: 0 } };

  return (
    <div className="space-y-5">

      {/* ── Confirmation Dialog ── */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-w-sm w-full mx-4"
          >
            <h3 className="text-base font-bold text-[#444]">{confirmDialog.title}</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-3 mt-5 justify-end">
              <Button variant="outline" size="sm" onClick={closeConfirm}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={confirmDialog.onConfirm}>Confirm</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={easeOut}>
        <h1 className="text-2xl font-bold text-[#444] tracking-tight">HOD Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">Full access across all classes and staff.</p>
      </motion.div>


      {/* ══════════════════════════════════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <motion.div
          className="space-y-5"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Class Teachers"
              value={loadingS ? "—" : staff.length.toString()}
              sub="Active staff"
              icon={<Users size={18} className="text-primary" />}
              iconBg="bg-primary-50"
              delay={0.05}
            />
            <StatCard
              label="Pending Leaves"
              value={loadingL ? "—" : staffPendingCount.toString()}
              sub={`${staffPendingCount} staff requests`}
              icon={<Clock size={18} className="text-amber-500" />}
              iconBg="bg-amber-50"
              badge={staffPendingCount > 0 ? "Action needed" : "All clear"}
              badgeVariant={staffPendingCount > 0 ? "warning" : "success"}
              delay={0.1}
            />
            <StatCard
              label="Pending Enquiries"
              value={loadingA ? "—" : pendingAdmissions.toString()}
              sub="Admission requests"
              icon={<BookOpen size={18} className="text-blue-500" />}
              iconBg="bg-blue-50"
              badge={pendingAdmissions > 0 ? "Review needed" : "All clear"}
              badgeVariant={pendingAdmissions > 0 ? "info" : "success"}
              delay={0.15}
            />
            <StatCard
              label="Overdue Fees"
              value={loadingF ? "—" : feesSummary.OVERDUE.count.toString()}
              sub={`₹${(feesSummary.OVERDUE.total ?? 0).toLocaleString()} pending`}
              icon={<AlertCircle size={18} className="text-red-500" />}
              iconBg="bg-red-50"
              badge={feesSummary.OVERDUE.count > 0 ? "Attention" : "Clear"}
              badgeVariant={feesSummary.OVERDUE.count > 0 ? "danger" : "success"}
              delay={0.2}
            />
          </div>

          {/* Fees summary cards */}
          <Card title="Fees Overview" subtitle="Aggregated across all students" delay={0.25}>
            {loadingF ? (
              <div className="grid grid-cols-3 gap-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(["PAID", "PENDING", "OVERDUE"] as const).map((status) => {
                    const cfg = {
                      PAID:    { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                      PENDING: { color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100"   },
                      OVERDUE: { color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100"     },
                    }[status];
                    const s = feesSummary[status] ?? { count: 0, total: 0 };
                    return (
                      <div key={status} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{status}</p>
                        <p className={`text-2xl font-bold mt-1 ${cfg.color}`}>₹{s.total.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.count} record{s.count !== 1 ? "s" : ""}</p>
                      </div>
                    );
                  })}
                </div>
                {/* Fix #6: Per-class overdue breakdown */}
                {feesSummary.OVERDUE.count > 0 && (() => {
                  const classBreakdown: Record<string, number> = {};
                  (fees?.fees ?? []).filter(f => f.status === "OVERDUE").forEach((f: any) => {
                    const cls = f.student?.classEnrolled ?? "Unknown";
                    classBreakdown[cls] = (classBreakdown[cls] ?? 0) + Number(f.amount);
                  });
                  const entries = Object.entries(classBreakdown).sort((a, b) => b[1] - a[1]);
                  return entries.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Overdue by Class</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {entries.map(([cls, amt]) => (
                          <div key={cls} className="rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                            <p className="text-xs font-semibold text-red-600">{cls}</p>
                            <p className="text-sm font-bold text-red-700">₹{amt.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          LEAVE TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "leave" && (
        <div className="space-y-4">
          <StaffLeaveSection />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAFF TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          {/* Staff Management Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={easeOut}
            className="space-y-4"
          >
            {/* Pending & Approved & All Teachers Tabs */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setLeaveSubTab("student")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  leaveSubTab === "student"
                    ? "bg-primary text-white shadow-glow"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-primary hover:text-primary"
                }`}
              >
                <Clock size={16} />
                Pending Staff
              </button>
              <button
                onClick={() => setLeaveSubTab("staff")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  leaveSubTab === "staff"
                    ? "bg-primary text-white shadow-glow"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-primary hover:text-primary"
                }`}
              >
                <CheckCircle2 size={16} />
                Approved Staff
              </button>
              <button
                onClick={() => setLeaveSubTab("admin")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  leaveSubTab === "admin"
                    ? "bg-primary text-white shadow-glow"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-primary hover:text-primary"
                }`}
              >
                <Users size={16} />
                All Staff
              </button>
            </div>

            {/* Pending Staff List */}
            {leaveSubTab === "student" && (
              <Card title="Pending Staff Registrations" subtitle="New staff waiting for approval" noPadding delay={0.1}>
                {loadingS ? (
                  <SkeletonTable rows={3} />
                ) : staff.filter(s => !s.isActive).length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No pending staff registrations</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-50">
                          {["Name", "Email", "Role", "Requested Class", "Actions"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {staff.filter(s => !s.isActive).map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-[#444]">{s.name}</td>
                            <td className="px-4 py-3 text-gray-400">{s.email}</td>
                            <td className="px-4 py-3">
                              <span className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary text-xs font-semibold">
                                {s.role === "CLASS_TEACHER" ? "Class Teacher" : s.role === "NON_TEACHING_STAFF" ? "Non-Teaching Staff" : s.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500">{s.assignedClass || "—"}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <Button size="xs" variant="secondary" onClick={() => {
                                  // Approve logic here
                                  showConfirm(
                                    "Approve Staff",
                                    `Approve ${s.name} as ${s.role === "CLASS_TEACHER" ? "Class Teacher" : s.role === "NON_TEACHING_STAFF" ? "Non-Teaching Staff" : s.role}?`,
                                    async () => {
                                      closeConfirm();
                                      const res = await fetch(`/api/hod/staff/${s.id}/approve`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ assignedClass: null }),
                                      });
                                      if (res.ok) {
                                        setStaff(prev => prev.map(st => st.id === s.id ? { ...st, isActive: true } : st));
                                        toast.success("Staff approved", `${s.name} account activated.`);
                                      } else {
                                        const data = await res.json();
                                        toast.error("Failed", data.error || "Please try again.");
                                      }
                                    }
                                  );
                                }}>Approve</Button>
                                <Button size="xs" variant="danger" onClick={() => {
                                  // Reject logic here
                                  showConfirm(
                                    "Reject Staff",
                                    `Reject ${s.name}'s registration? This cannot be undone.`,
                                    async () => {
                                      closeConfirm();
                                      const res = await fetch(`/api/hod/staff/${s.id}/reject`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                      });
                                      if (res.ok) {
                                        setStaff(prev => prev.filter(st => st.id !== s.id));
                                        toast.success("Staff rejected", "Registration removed.");
                                      } else {
                                        toast.error("Failed", "Please try again.");
                                      }
                                    }
                                  );
                                }}>Reject</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {/* Approved Staff List */}
            {leaveSubTab === "staff" && (
              <div className="space-y-4">
                <Card title="Approved Staff" subtitle="Active staff members and their assignments" noPadding delay={0.1}>
                  {loadingS ? (
                    <SkeletonTable rows={4} />
                  ) : (() => {
                    const approvedTeachers = staff.filter(s => s.isActive && (s.role === "CLASS_TEACHER" || s.role === "NON_TEACHING_STAFF"));
                    const approvedPages = Math.max(1, Math.ceil(approvedTeachers.length / TEACHERS_PAGE_SIZE));
                    const paginatedApproved = approvedTeachers.slice((teachersPage - 1) * TEACHERS_PAGE_SIZE, teachersPage * TEACHERS_PAGE_SIZE);

                    return (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-50">
                                {["Name", "Email", "Role", "Assigned Class", "Students", "Pending Leave"].map(h => (
                                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {paginatedApproved.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-4 py-3 font-medium text-[#444]">{s.name}</td>
                                  <td className="px-4 py-3 text-gray-400">{s.email}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${s.role === "NON_TEACHING_STAFF" ? "bg-purple-50 text-purple-600" : "bg-primary-50 text-primary"}`}>
                                      {s.role === "CLASS_TEACHER" ? "Class Teacher" : "Non-Teaching Staff"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {s.role === "CLASS_TEACHER" ? (
                                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold">
                                        {s.assignedClass ?? "Unassigned"}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-300">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-gray-500">{s.role === "CLASS_TEACHER" ? (s.studentCount || 0) : "—"}</td>
                                  <td className="px-4 py-3">
                                    {s.pendingLeaveCount > 0 ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                                        <Clock size={10} /> {s.pendingLeaveCount}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-300">None</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              {paginatedApproved.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No approved staff found.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        {approvedPages > 1 && (
                          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
                            <p className="text-xs text-gray-400">{approvedTeachers.length} total · Page {teachersPage} of {approvedPages}</p>
                            <div className="flex gap-1.5">
                              <button onClick={() => setTeachersPage(p => Math.max(1, p - 1))} disabled={teachersPage === 1}
                                className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 disabled:opacity-40 hover:bg-gray-200 transition-colors">Prev</button>
                              <button onClick={() => setTeachersPage(p => Math.min(approvedPages, p + 1))} disabled={teachersPage === approvedPages}
                                className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 disabled:opacity-40 hover:bg-gray-200 transition-colors">Next</button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </Card>
              </div>
            )}
          </motion.div>

          {/* All Staff List - Show when All Staff tab is active */}
          {leaveSubTab === "admin" && (
            <Card title="All Active Staff" subtitle="Complete list of all active staff members" noPadding delay={0.2}>
              {loadingS ? (
                <SkeletonTable rows={4} />
              ) : (() => {
                const filteredTeachers = staff.filter(s => s.isActive);
                const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / TEACHERS_PAGE_SIZE));
                const paginatedTeachers = filteredTeachers.slice((teachersPage - 1) * TEACHERS_PAGE_SIZE, teachersPage * TEACHERS_PAGE_SIZE);

                return (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-50">
                            {["Name", "Email", "Role", "Assigned Class", "Students", "Pending Leave", "Status"].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {paginatedTeachers.map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3 font-medium text-[#444]">{s.name}</td>
                              <td className="px-4 py-3 text-gray-400">{s.email}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${s.role === "NON_TEACHING_STAFF" ? "bg-purple-50 text-purple-600" : "bg-primary-50 text-primary"}`}>
                                  {s.role === "CLASS_TEACHER" ? "Class Teacher" : s.role === "NON_TEACHING_STAFF" ? "Non-Teaching Staff" : s.role}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {s.role === "CLASS_TEACHER" ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary text-xs font-semibold">
                                    {s.assignedClass ?? "Unassigned"}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-300">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-500">{s.role === "CLASS_TEACHER" ? (s.studentCount || 0) : "—"}</td>
                              <td className="px-4 py-3">
                                {s.pendingLeaveCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                                    <Clock size={10} /> {s.pendingLeaveCount} pending
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-300">None</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={s.isActive ? "success" : "neutral"} dot>
                                  {s.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                          {paginatedTeachers.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No active staff found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
                        <p className="text-xs text-gray-400">{filteredTeachers.length} total · Page {teachersPage} of {totalPages}</p>
                        <div className="flex gap-1.5">
                          <button onClick={() => setTeachersPage(p => Math.max(1, p - 1))} disabled={teachersPage === 1}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 disabled:opacity-40 hover:bg-gray-200 transition-colors">Prev</button>
                          <button onClick={() => setTeachersPage(p => Math.min(totalPages, p + 1))} disabled={teachersPage === totalPages}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 disabled:opacity-40 hover:bg-gray-200 transition-colors">Next</button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </Card>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          FEES TAB (Class filter + per-student status)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "fees" && (
        <div className="space-y-4">
          <Card title="Fee Status" subtitle="Track paid / pending / overdue by class" noPadding delay={0.1}>
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Class</span>
                <select
                  value={feeClass}
                  onChange={(e) => setFeeClass(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-[#444] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="ALL">All</option>
                  {(feesView?.classes ?? []).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-gray-400">
                {feesView?.summary ? (
                  <span>
                    PAID: {feesView.summary.PAID?.count ?? 0} · PENDING: {feesView.summary.PENDING?.count ?? 0} · OVERDUE: {feesView.summary.OVERDUE?.count ?? 0}
                  </span>
                ) : null}
              </div>
            </div>

            {loadingFV ? (
              <SkeletonTable rows={7} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {["Student", "Class", "Roll No.", "Term", "Amount", "Paid", "Due", "Status"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(feesView?.fees ?? []).map((f: any) => (
                      <tr key={f.id} className={`hover:bg-gray-50/50 transition-colors ${f.status === "OVERDUE" ? "bg-red-50/30" : ""}`}>
                        <td className="px-4 py-3 font-medium text-[#444] whitespace-nowrap">{f.student?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{f.student?.classEnrolled ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">{f.student?.rollNumber ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{f.term}</td>
                        <td className="px-4 py-3 text-gray-500">₹{Number(f.amount).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-gray-500">₹{Number(f.paidAmount).toLocaleString("en-IN")}</td>
                        <td className={`px-4 py-3 font-semibold ${Number(f.amount) - Number(f.paidAmount) > 0 ? "text-red-600" : "text-emerald-700"}`}>
                          ₹{(Number(f.amount) - Number(f.paidAmount)).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={f.status === "PAID" ? "success" : f.status === "OVERDUE" ? "danger" : "warning"} dot>
                            {String(f.status).toLowerCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {(feesView?.fees ?? []).length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No fee records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ANNOUNCEMENTS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "announcements" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              icon={showForm ? <X size={14} /> : <Plus size={14} />}
              variant={showForm ? "outline" : "primary"}
              onClick={() => showForm ? resetForm() : setShowForm(true)}
            >
              {showForm ? "Cancel" : "New Announcement"}
            </Button>
          </div>

          {showForm && (
            <motion.div
              ref={formRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={easeOut}
            >
              <Card title={editingId ? "Edit Announcement" : "Create Announcement"} subtitle="Will be visible to all students immediately" delay={0}>
                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Title *"
                      placeholder="Announcement title"
                      value={annForm.title}
                      onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))}
                      error={annErrors.title}
                    />
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-[#444]">Category *</label>
                      <select
                        value={annForm.category}
                        onChange={e => setAnnForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#444] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Author *"
                      placeholder="e.g. Principal's Office"
                      value={annForm.author}
                      onChange={e => setAnnForm(f => ({ ...f, author: e.target.value }))}
                      error={annErrors.author}
                    />
                    <Input
                      label="Date *"
                      type="date"
                      value={annForm.date}
                      onChange={e => setAnnForm(f => ({ ...f, date: e.target.value }))}
                      error={annErrors.date}
                    />
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-[#444]">Target Audience *</label>
                      <select
                        value={annForm.target}
                        onChange={e => setAnnForm(f => ({ ...f, target: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#444] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        <option value="BOTH">Both (Students & Staff)</option>
                        <option value="STUDENT">Students Only</option>
                        <option value="STAFF">Staff Only</option>
                      </select>
                    </div>
                  </div>

                  <Textarea
                    label="Description *"
                    placeholder="Write the announcement content..."
                    rows={4}
                    value={annForm.description}
                    onChange={e => setAnnForm(f => ({ ...f, description: e.target.value }))}
                    error={annErrors.description}
                  />

                  <Input
                    label="Image URL (optional)"
                    placeholder="https://images.unsplash.com/..."
                    value={annForm.imageUrl}
                    onChange={e => setAnnForm(f => ({ ...f, imageUrl: e.target.value }))}
                  />
                  {/* Fix #9: Image preview */}
                  {annForm.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-gray-100 h-32 w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={annForm.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                    <Button type="submit" loading={annLoading} icon={<Megaphone size={14} />}>
                      {editingId ? "Save Changes" : "Publish Announcement"}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {/* Fix #1 — all announcements with edit/delete + pagination */}
          <Card title="All Announcements" subtitle={`${recentAnns.length} total`} noPadding delay={0.1}>
            {loadingAnns ? (
              <SkeletonTable rows={3} />
            ) : recentAnns.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No announcements yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentAnns.map((ann) => (
                  <div key={ann.id} className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                    {ann.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ann.imageUrl} alt={ann.title} className="h-12 w-16 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary">{ann.category}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          ann.target === "STUDENT" ? "bg-emerald-50 text-emerald-700" :
                          ann.target === "STAFF" ? "bg-purple-50 text-purple-700" :
                          "bg-blue-50 text-blue-700"
                        }`}>
                          {ann.target === "STUDENT" ? "Students Only" :
                           ann.target === "STAFF" ? "Staff Only" :
                           "Everyone"}
                        </span>
                        <span className="text-[10px] text-gray-400">{new Date(ann.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      <p className="text-sm font-semibold text-[#444] truncate">{ann.title}</p>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{ann.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button size="xs" variant="outline" onClick={() => openEdit(ann)}>Edit</Button>
                      <Button size="xs" variant="danger"  onClick={() => handleDeleteAnnouncement(ann.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          REASSIGN CLASS MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {reassignModal.open && reassignModal.staff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-w-sm w-full mx-4"
          >
            <h3 className="text-base font-bold text-[#444]">Reassign Class</h3>
            <p className="mt-1 text-sm text-gray-500">
              Reassign <span className="font-semibold">{reassignModal.staff.name}</span> to a new class
            </p>

            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="class-select" className="block text-sm font-medium text-[#444]">Select New Class *</label>
                <select
                  id="class-select"
                  value={reassignModal.selectedClass}
                  onChange={(e) => setReassignModal(m => ({ ...m, selectedClass: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#444] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="">-- Select a class --</option>
                  {CLASSES.map(cls => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Note:</span> Students in the old class will remain in their current class. Only the teacher&apos;s assignment changes.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReassignModal({ open: false, staff: null, selectedClass: "" })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!reassignModal.selectedClass}
                onClick={async () => {
                  if (!reassignModal.selectedClass) return;

                  const res = await fetch(`/api/hod/staff/${reassignModal.staff.id}/reassign-class`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ newClass: reassignModal.selectedClass }),
                  });

                  if (res.ok) {
                    setStaff(prev =>
                      prev.map(s =>
                        s.id === reassignModal.staff.id
                          ? { ...s, assignedClass: reassignModal.selectedClass }
                          : s
                      )
                    );
                    toast.success("Class reassigned", `${reassignModal.staff.name} is now assigned to ${reassignModal.selectedClass}`);
                    setReassignModal({ open: false, staff: null, selectedClass: "" });
                  } else {
                    const data = await res.json();
                    toast.error("Failed to reassign", data.error || "Please try again.");
                  }
                }}
              >
                Confirm Reassignment
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
