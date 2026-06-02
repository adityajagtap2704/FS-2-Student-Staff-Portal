"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Menu, Bell, Search, LogOut, X, Trash2, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./../../components/ui/Toast";

interface TopbarProps {
  session: Session | null;
  onMenuClick: () => void;
  title?: string;
}

// ── Detail card rendered via portal directly into document.body ───────────────
function StudentCard({ student, onClose }: { student: any; onClose: () => void }) {
  const initials = (student.name ?? "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      {/* backdrop — no blur, just a light dim */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)" }} />
      {/* card */}
      <div style={{ position: "relative", width: "100%", maxWidth: 440, background: "#fff", borderRadius: 24, boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden", marginTop: "-60px" }}>
        {/* coloured top bar */}
        <div style={{ height: 5, background: "linear-gradient(90deg,#10b981,#34d399)" }} />
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 14px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ height: 44, width: 44, borderRadius: 14, background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(16,185,129,0.2)" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>{initials}</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1f2937" }}>{student.name ?? "—"}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#10b981", fontWeight: 500 }}>Student Profile</p>
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#f9fafb", cursor: "pointer", padding: 6, borderRadius: 10, color: "#6b7280", display: "flex", transition: "background 0.15s" }}>
            <X size={15} />
          </button>
        </div>
        {/* body */}
        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
          <Field label="Class"       value={student.classEnrolled ?? "—"} />
          <Field label="Roll No."    value={student.rollNumber ?? "—"} />
          <Field label="Email"       value={student.email ?? "—"} span />
          <Field label="Phone"       value={student.phone ?? "—"} />
          <Field label="Parent Name" value={student.parentName ?? "—"} />
          {student.parentEmail ? <Field label="Parent Email" value={student.parentEmail} span /> : null}
          {student.admissionDate ? (
            <Field label="Admitted" value={new Date(student.admissionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
          ) : null}
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>Status</p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: student.isActive ? "#ecfdf5" : "#fef2f2", color: student.isActive ? "#059669" : "#dc2626", border: `1px solid ${student.isActive ? "#a7f3d0" : "#fecaca"}` }}>
              <span style={{ height: 6, width: 6, borderRadius: "50%", background: student.isActive ? "#10b981" : "#ef4444", display: "inline-block" }} />
              {student.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        {/* footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", background: "#fafafa" }}>
          <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <X size={12} /> Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function StaffCard({ staff, onClose }: { staff: any; onClose: () => void }) {
  const initials = (staff.name ?? "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 440, background: "#fff", borderRadius: 24, boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden", marginTop: "-60px" }}>
        {/* coloured top bar */}
        <div style={{ height: 5, background: "linear-gradient(90deg,#f59e0b,#fbbf24)" }} />
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 14px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ height: 44, width: 44, borderRadius: 14, background: "linear-gradient(135deg,#fef3c7,#fde68a)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(245,158,11,0.2)" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#d97706" }}>{initials}</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1f2937" }}>{staff.name ?? "—"}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#f59e0b", fontWeight: 500 }}>Staff Profile</p>
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#f9fafb", cursor: "pointer", padding: 6, borderRadius: 10, color: "#6b7280", display: "flex" }}>
            <X size={15} />
          </button>
        </div>
        {/* body */}
        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
          <Field label="Email" value={staff.email ?? "—"} span />
          <Field label="Role"  value={staff.role === "CLASS_TEACHER" ? "Class Teacher" : "Non-Teaching Staff"} />
          <Field label="Assigned Class" value={staff.assignedClass ?? "—"} />
          {staff.studentCount !== undefined ? <Field label="Students" value={String(staff.studentCount)} /> : null}
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>Status</p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: staff.isOnLeave ? "#fef2f2" : staff.isActive ? "#ecfdf5" : "#f3f4f6", color: staff.isOnLeave ? "#dc2626" : staff.isActive ? "#059669" : "#6b7280", border: `1px solid ${staff.isOnLeave ? "#fecaca" : staff.isActive ? "#a7f3d0" : "#e5e7eb"}` }}>
              <span style={{ height: 6, width: 6, borderRadius: "50%", background: staff.isOnLeave ? "#ef4444" : staff.isActive ? "#10b981" : "#9ca3af", display: "inline-block" }} />
              {staff.isOnLeave ? "On Leave" : staff.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {staff.pendingLeaveCount > 0 ? <Field label="Pending Leaves" value={`${staff.pendingLeaveCount} pending`} /> : null}
        </div>
        {/* footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", background: "#fafafa" }}>
          <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <X size={12} /> Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Field({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div style={{ gridColumn: span ? "1 / -1" : undefined }}>
      <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
    </div>
  );
}

export default function Topbar({ session, onMenuClick, title }: TopbarProps) {
  const [signingOut,    setSigningOut]    = useState(false);
  const [scrolled,      setScrolled]      = useState(false);
  const [showNotif,     setShowNotif]     = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [activeIndex,   setActiveIndex]   = useState(0);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [studentResults,  setStudentResults]  = useState<any[]>([]);
  const [studentLoading,  setStudentLoading]  = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [staffResults,    setStaffResults]    = useState<any[]>([]);
  const [staffLoading,    setStaffLoading]    = useState(false);
  const [selectedStaff,   setSelectedStaff]   = useState<any | null>(null);
  const studentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staffTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast  = useToast();
  const router = useRouter();
  const user   = session?.user as any;
  const role   = user?.role ?? "STUDENT";

  const searchItems = useMemo(() => {
    const all = [
      { href: "/dashboard",                          label: "Dashboard",            keywords: ["home","overview","main"] },
      { href: "/dashboard/fees",                     label: "Fees",                 keywords: ["fee","invoice","dues"] },
      { href: "/dashboard/payments",                 label: "Payments",             keywords: ["payment","receipt","transactions"] },
      { href: "/dashboard/documents",                label: "Documents",            keywords: ["document","file","upload","download"] },
      { href: "/dashboard/timetable",                label: "Timetable",            keywords: ["schedule","class","period","time"] },
      { href: "/dashboard/leave",                    label: "Leave",                keywords: ["leave","absence","request","time off"] },
      { href: "/dashboard/announcements",            label: "Announcements",        keywords: ["announcement","notice","news"] },
      { href: "/dashboard/profile",                  label: "My Profile",           keywords: ["profile","account","details"] },
      { href: "/dashboard/staff",                    label: "Staff Dashboard",      keywords: ["staff dashboard","my dashboard"] },
      { href: "/dashboard/staff/timetable",          label: "Staff Timetable",      keywords: ["schedule","class"] },
      { href: "/dashboard/staff/my-leaves",          label: "My Leaves",            keywords: ["my leaves","leave request"] },
      { href: "/dashboard/staff/leaves",             label: "Student Leaves",       keywords: ["student leave","leave requests"] },
      { href: "/dashboard/staff/students",           label: "My Students",          keywords: ["students","class","pupils"] },
      { href: "/dashboard/staff/payments",           label: "Staff Payments",       keywords: ["staff payments","transactions"] },
      { href: "/dashboard/hod",                      label: "HOD Dashboard",        keywords: ["hod dashboard","admin"] },
      { href: "/dashboard/hod/timetable",            label: "HOD Timetable",        keywords: ["schedule","timetable"] },
      { href: "/dashboard/hod/class-assignments",    label: "Class Assignments",    keywords: ["assignments","classes"] },
      { href: "/dashboard/hod/outstanding-payments", label: "Outstanding Fees",     keywords: ["outstanding","fees"] },
      { href: "/dashboard/hod/documents",            label: "Document Verification",keywords: ["document verification","documents"] },
    ];
    if (role === "HOD")          return all.filter(i => i.href.startsWith("/dashboard/hod") || i.href === "/dashboard" || i.href === "/dashboard/announcements");
    if (role === "CLASS_TEACHER") return all.filter(i => i.href.startsWith("/dashboard/staff") || i.href === "/dashboard" || i.href === "/dashboard/announcements");
    return all.filter(i => !i.href.startsWith("/dashboard/staff") && !i.href.startsWith("/dashboard/hod"));
  }, [role]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return searchItems;
    return searchItems.filter(i => i.label.toLowerCase().includes(q) || i.keywords.some(k => k.includes(q)));
  }, [searchItems, searchQuery]);

  const openSearch = () => { setSearchOpen(true); setTimeout(() => document.getElementById("dash-search")?.focus(), 10); };
  const closeSearch = useCallback(() => {
    setSearchOpen(false); setSearchQuery(""); setActiveIndex(0);
    setStudentResults([]); setSelectedStudent(null);
    setStaffResults([]);   setSelectedStaff(null);
  }, []);
  const navigateTo = useCallback((href: string) => { closeSearch(); router.push(href); }, [closeSearch, router]);

  const canSearchStudents = role === "HOD" || role === "CLASS_TEACHER";

  // debounced student search
  useEffect(() => {
    if (!canSearchStudents || !searchOpen) return;
    const q = searchQuery.trim();
    if (!q) { setStudentResults([]); return; }
    if (studentTimer.current) clearTimeout(studentTimer.current);
    studentTimer.current = setTimeout(async () => {
      setStudentLoading(true);
      try {
        const url = role === "HOD" ? `/api/students?q=${encodeURIComponent(q)}&limit=8` : `/api/staff/students/search?q=${encodeURIComponent(q)}`;
        const d = await fetch(url).then(r => r.json());
        setStudentResults(Array.isArray(d) ? d.slice(0, 8) : []);
      } catch { setStudentResults([]); }
      finally { setStudentLoading(false); }
    }, 300);
    return () => { if (studentTimer.current) clearTimeout(studentTimer.current); };
  }, [searchQuery, searchOpen, canSearchStudents, role]);

  // debounced staff search (HOD only)
  useEffect(() => {
    if (role !== "HOD" || !searchOpen) return;
    const q = searchQuery.trim();
    if (!q) { setStaffResults([]); return; }
    if (staffTimer.current) clearTimeout(staffTimer.current);
    staffTimer.current = setTimeout(async () => {
      setStaffLoading(true);
      try {
        const d = await fetch(`/api/hod/staff/search?q=${encodeURIComponent(q)}`).then(r => r.json());
        setStaffResults(Array.isArray(d) ? d.slice(0, 6) : []);
      } catch { setStaffResults([]); }
      finally { setStaffLoading(false); }
    }, 300);
    return () => { if (staffTimer.current) clearTimeout(staffTimer.current); };
  }, [searchQuery, searchOpen, role]);

  // keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") { e.preventDefault(); openSearch(); }
      if (k === "escape" && searchOpen) { e.preventDefault(); closeSearch(); }
      if (searchOpen && (k === "arrowdown" || k === "arrowup" || k === "enter")) {
        e.preventDefault();
        const max = filteredItems.length - 1;
        if (k === "arrowdown") setActiveIndex(p => Math.min(p + 1, max));
        if (k === "arrowup")   setActiveIndex(p => Math.max(p - 1, 0));
        if (k === "enter" && filteredItems[activeIndex]) navigateTo(filteredItems[activeIndex].href);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [searchOpen, filteredItems, activeIndex, navigateTo, closeSearch]);

  useEffect(() => { if (searchOpen) setActiveIndex(0); }, [searchOpen, searchQuery]);

  useEffect(() => {
    const el = document.querySelector("main");
    if (!el) return;
    const h = () => setScrolled(el.scrollTop > 10);
    el.addEventListener("scroll", h, { passive: true });
    return () => el.removeEventListener("scroll", h);
  }, []);

  // notifications polling
  useEffect(() => {
    if (!session?.user) return;
    const fetch_ = () => fetch("/api/notifications").then(r => r.json()).then(d => {
      setUnreadCount(d.unreadCount ?? 0);
      setNotifications((d.notifications ?? []).slice(0, 10));
    }).catch(() => {});
    fetch_();
    const t = setInterval(fetch_, 10_000);
    return () => clearInterval(t);
  }, [session?.user]);

  const handleSignOut = async () => { setSigningOut(true); await signOut({ callbackUrl: "/login" }); };

  const handleNotifClick = async (n: { id: number; isRead: boolean; title?: string; message?: string }) => {
    if (!n.isRead) {
      await fetch(`/api/notifications/${n.id}`, { method: "PATCH" }).catch(() => {});
      setNotifications(p => p.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      setUnreadCount(p => Math.max(0, p - 1));
    }
    const titleLower = (n.title ?? "").toLowerCase();
    const msgLower = (n.message ?? "").toLowerCase();
    setShowNotif(false);
    if (titleLower.includes("timetable")) {
      if (role === "HOD") router.push("/dashboard/hod/timetable");
      else if (role === "CLASS_TEACHER") router.push("/dashboard/staff/timetable");
      else router.push("/dashboard/timetable");
    } else if (
      titleLower.includes("leave") ||
      titleLower.includes("substitute") ||
      titleLower.includes("absent") ||
      msgLower.includes("substitute") ||
      msgLower.includes("class assignment")
    ) {
      if (role === "HOD") router.push("/dashboard/hod/class-assignments");
      else if (role === "CLASS_TEACHER") router.push("/dashboard/staff/my-leaves");
      else router.push("/dashboard/leave");
    }
  };

  const handleDeleteNotif = async (id: number) => {
    const r = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    if (r.ok) { setNotifications(p => p.filter(n => n.id !== id)); setUnreadCount(p => Math.max(0, p - 1)); toast.success("Notification deleted", ""); }
  };

  const handleClearAll = async () => {
    const r = await fetch("/api/notifications", { method: "DELETE" });
    if (r.ok) { setNotifications([]); setUnreadCount(0); toast.success("All notifications cleared", ""); }
  };

  const initials = session?.user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";

  return (
    <>
      <motion.header
        animate={{ backgroundColor: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.8)", boxShadow: scrolled ? "0 1px 12px rgba(0,0,0,0.06)" : "0 1px 0 rgba(0,0,0,0.04)" }}
        transition={{ duration: 0.2 }}
        className="h-16 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50 shrink-0"
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <motion.button onClick={onMenuClick} className="lg:hidden h-9 w-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} aria-label="Open sidebar">
            <Menu size={18} />
          </motion.button>
          <AnimatePresence mode="wait">
            {title && (
              <motion.h1 key={title} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }} className="hidden sm:block text-sm font-semibold text-[#444]">
                {title}
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Search trigger */}
          <motion.button onClick={openSearch} className="hidden md:flex items-center gap-2 h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-400 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 group" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Search size={14} className="group-hover:text-gray-500 transition-colors" />
            <span>Search...</span>
            <kbd className="ml-1 px-1.5 py-0.5 text-[10px] bg-gray-100 rounded font-mono">⌘K</kbd>
          </motion.button>

          {/* Search palette */}
          <AnimatePresence>
            {searchOpen && (
              <>
                <motion.div className="fixed inset-0 z-40 bg-black/10" onClick={closeSearch} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4 pointer-events-none">
                  <motion.div initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.98 }} transition={{ duration: 0.16 }} className="pointer-events-auto w-full max-w-sm flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                    {/* input */}
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 shrink-0">
                      <Search size={15} className="text-gray-400 shrink-0" />
                      <input id="dash-search" autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent py-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                        placeholder={canSearchStudents ? "Search pages or students..." : "Search pages..."} />
                      <button onClick={closeSearch} className="h-6 w-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"><X size={14} /></button>
                    </div>
                    <div className="overflow-y-auto max-h-[55vh]">
                      {/* students */}
                      {canSearchStudents && searchQuery.trim() && (
                        <div className="px-2 pt-2 pb-1 border-b border-gray-50">
                          <p className="px-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1"><User size={9} /> Students</p>
                          {studentLoading ? (
                            <div className="px-2 py-2 text-xs text-gray-400 flex items-center gap-2">
                              <motion.div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent shrink-0" animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} />
                              Searching...
                            </div>
                          ) : studentResults.length > 0 ? (
                            <ul>{studentResults.map(s => (
                              <li key={s.id}>
                                <button type="button" onClick={() => setSelectedStudent(s)} className="w-full text-left px-2 py-2 rounded-xl hover:bg-primary/5 flex items-center gap-2.5 group transition-colors">
                                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="text-[10px] font-bold text-primary">{(s.name ?? "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-[#444] truncate">{s.name}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{s.classEnrolled ?? "—"} · Roll {s.rollNumber ?? "—"}</p>
                                  </div>
                                  <span className="text-[10px] text-gray-300 group-hover:text-primary/60 shrink-0">→</span>
                                </button>
                              </li>
                            ))}</ul>
                          ) : <p className="px-2 py-2 text-xs text-gray-400">No students found.</p>}
                        </div>
                      )}
                      {/* staff (HOD only) */}
                      {role === "HOD" && searchQuery.trim() && (
                        <div className="px-2 pt-2 pb-1 border-b border-gray-50">
                          <p className="px-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1"><User size={9} /> Staff</p>
                          {staffLoading ? (
                            <div className="px-2 py-2 text-xs text-gray-400 flex items-center gap-2">
                              <motion.div className="h-3 w-3 rounded-full border-2 border-amber-400 border-t-transparent shrink-0" animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} />
                              Searching...
                            </div>
                          ) : staffResults.length > 0 ? (
                            <ul>{staffResults.map(s => (
                              <li key={s.id}>
                                <button type="button" onClick={() => setSelectedStaff(s)} className="w-full text-left px-2 py-2 rounded-xl hover:bg-amber-50 flex items-center gap-2.5 group transition-colors">
                                  <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                    <span className="text-[10px] font-bold text-amber-600">{(s.name ?? "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-[#444] truncate">{s.name}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{s.role === "CLASS_TEACHER" ? `Class Teacher · ${s.assignedClass ?? "Unassigned"}` : "Non-Teaching Staff"}</p>
                                  </div>
                                  <span className="text-[10px] text-gray-300 group-hover:text-amber-500 shrink-0">→</span>
                                </button>
                              </li>
                            ))}</ul>
                          ) : <p className="px-2 py-2 text-xs text-gray-400">No staff found.</p>}
                        </div>
                      )}
                      {/* pages */}
                      <div className="px-2 py-2">
                        {searchQuery.trim() && filteredItems.length > 0 && <p className="px-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Pages</p>}
                        {filteredItems.length > 0 ? (
                          <ul className="space-y-0.5">{filteredItems.map((item, idx) => (
                            <li key={item.href}>
                              <button type="button" onClick={() => navigateTo(item.href)} onMouseEnter={() => setActiveIndex(idx)}
                                className={`${idx === activeIndex ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-50"} w-full text-left px-2 py-2 rounded-xl transition-colors flex items-center justify-between`}>
                                <span className="text-xs font-medium">{item.label}</span>
                                <span className={`text-[10px] uppercase ${idx === activeIndex ? "text-primary/60" : "text-gray-300"}`}>{item.href.replace("/dashboard","").replace("/staff","staff ").replace("/hod","hod ") || "home"}</span>
                              </button>
                            </li>
                          ))}</ul>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>

          {/* Notifications */}
          <div className="relative">
            <motion.button className="relative h-9 w-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowNotif(!showNotif)} aria-label="Notifications">
              <Bell size={17} />
              {unreadCount > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-red-500 ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
            </motion.button>
            <AnimatePresence>
              {showNotif && (
                <>
                  <motion.div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-gray-100 shadow-soft z-20 overflow-hidden flex flex-col max-h-96">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between shrink-0">
                      <p className="text-sm font-semibold text-[#444]">Notifications</p>
                      {notifications.length > 0 && (
                        <motion.button onClick={handleClearAll} className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors flex items-center gap-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Trash2 size={12} /> Clear All
                        </motion.button>
                      )}
                    </div>
                    <ul className="divide-y divide-gray-50 overflow-y-auto flex-1">
                      {notifications.map((n, i) => (
                        <motion.li key={n.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ delay: i * 0.05 }} onClick={() => handleNotifClick(n)} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group cursor-pointer ${!n.isRead ? "bg-primary-50/30" : ""}`}>
                          <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? "bg-primary" : "bg-gray-200"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#444] leading-snug">{n.title}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-300 mt-0.5">{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                          </div>
                          <motion.button onClick={e => { e.stopPropagation(); handleDeleteNotif(n.id); }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <X size={14} />
                          </motion.button>
                        </motion.li>
                      ))}
                      {notifications.length === 0 && (
                        <li className="px-4 py-8 text-center">
                          <Bell size={24} className="mx-auto text-gray-200 mb-2" />
                          <p className="text-xs text-gray-400">No notifications yet</p>
                        </li>
                      )}
                    </ul>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="h-6 w-px bg-gray-200 mx-1" />

          {/* User */}
          <div className="flex items-center gap-2.5">
            <motion.div className="h-8 w-8 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-glow select-none cursor-default" whileHover={{ scale: 1.05, rotate: 3 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              {initials}
            </motion.div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-[#444] leading-tight">{session?.user?.name ?? "User"}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{session?.user?.email}</p>
            </div>
          </div>

          {/* Sign out */}
          <motion.button onClick={handleSignOut} disabled={signingOut} className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 disabled:opacity-50" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} aria-label="Sign out" title="Sign out">
            {signingOut ? (
              <motion.svg className="h-4 w-4" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </motion.svg>
            ) : <LogOut size={16} />}
          </motion.button>
        </div>
      </motion.header>

      {/* ── Detail cards rendered via portal — completely outside header stacking context ── */}
      {selectedStudent && <StudentCard student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
      {selectedStaff   && <StaffCard   staff={selectedStaff}     onClose={() => setSelectedStaff(null)}   />}
    </>
  );
}
