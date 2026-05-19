"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CreditCard, CalendarOff,
  Megaphone, UserCircle, X, GraduationCap,
  ChevronRight, ChevronLeft, Users, BookOpen,
  Bell, FileText, TableProperties, Clock, CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { Session } from "next-auth";

// ── Nav links per role ────────────────────────────────────────────────────────
const studentLinks = [
  { href: "/dashboard",               label: "Dashboard",     icon: LayoutDashboard, exact: true  },
  { href: "/dashboard/fees",          label: "Fees",          icon: CreditCard,      exact: false },
  { href: "/dashboard/payments",      label: "Payments",      icon: CreditCard,      exact: false },
  { href: "/dashboard/documents",     label: "Documents",     icon: FileText,        exact: false },
  { href: "/dashboard/timetable",     label: "Timetable",     icon: TableProperties, exact: false },
  { href: "/dashboard/leave",         label: "Leave",         icon: CalendarOff,     exact: false },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone,       exact: false },
  { href: "/dashboard/profile",       label: "My Profile",    icon: UserCircle,      exact: false },
];

const teacherLinks = [
  { href: "/dashboard/staff",         label: "My Dashboard",  icon: LayoutDashboard, exact: true  },
  { href: "/dashboard/staff/timetable", label: "Timetable",   icon: TableProperties, exact: false },
  { href: "/dashboard/staff/my-leaves", label: "My Leaves",   icon: CalendarOff,     exact: false },
  { href: "/dashboard/staff/leaves",  label: "Student Leaves", icon: CalendarOff,    exact: false },
  { href: "/dashboard/staff/students", label: "My Students", icon: Users,            exact: false },
  { href: "/dashboard/staff/fees",    label: "Fees",          icon: CreditCard,      exact: false },
  { href: "/dashboard/staff/payments", label: "Payments",    icon: CreditCard,       exact: false },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone,       exact: false },
];

const hodLinks = [
  { href: "/dashboard/hod",                     label: "HOD Dashboard", icon: LayoutDashboard, exact: true  },
  { href: "/dashboard/hod?tab=leave",           label: "Leave Approval", icon: Clock,          exact: true  },
  { href: "/dashboard/hod?tab=admissions",      label: "Admissions",    icon: BookOpen,       exact: true  },
  { href: "/dashboard/hod?tab=staff",           label: "Staff Portal",  icon: CheckCircle2,   exact: true  },
  { href: "/dashboard/hod?tab=fees",            label: "Fees Management",icon: CreditCard,     exact: true  },
  { href: "/dashboard/hod/timetable",           label: "Timetable",     icon: TableProperties, exact: false },
  { href: "/dashboard/hod/class-assignments",   label: "Class Assignments", icon: Users,      exact: false },
  { href: "/dashboard/hod/outstanding-payments",label: "Outstanding Fees", icon: CreditCard,  exact: false },
  { href: "/dashboard/hod/documents",           label: "Document Verification", icon: FileText, exact: false },
  { href: "/dashboard/announcements",           label: "Announcements", icon: Megaphone,       exact: false },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  session: Session | null;
}

export default function Sidebar({ open, onClose, session }: SidebarProps) {
  const pathname  = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const [collapsed, setCollapsed] = useState(false);

  const role = (session?.user as any)?.role ?? "STUDENT";
  const navLinks =
    role === "HOD"           ? hodLinks     :
    role === "CLASS_TEACHER" ? teacherLinks :
    studentLinks;

  const portalLabel =
    role === "HOD"           ? "HOD Portal"     :
    role === "CLASS_TEACHER" ? "Staff Portal"   :
    "Student Portal";

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          fixed top-0 left-0 z-30 h-full flex flex-col
          bg-[#fafbfc] border-r border-gray-100 overflow-hidden
          lg:static lg:z-auto
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          transition-transform duration-300 lg:transition-none
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <motion.div
              className="h-8 w-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <GraduationCap size={16} className="text-white" />
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <span className="text-sm font-bold text-[#444] tracking-tight whitespace-nowrap">KALNET</span>
                  <p className="text-[10px] text-gray-400 leading-none whitespace-nowrap">{portalLabel}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile close / Desktop collapse */}
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="lg:hidden h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
            <motion.button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex h-7 w-7 rounded-lg items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </motion.button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2" aria-label="Main navigation">
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap"
              >
                Menu
              </motion.p>
            )}
          </AnimatePresence>

          <ul className="space-y-0.5">
            {navLinks.map(({ href, label, icon: Icon, exact }) => {
              const isTabMatch = href.includes("?tab=")
                ? currentTab === href.split("?tab=")[1]
                : !currentTab;

              const isActive = exact
                ? (pathname === href.split("?")[0] && isTabMatch)
                : pathname.startsWith(href.split("?")[0]);

              return (
                <li key={href}>
                  <Link href={href} onClick={onClose}>
                    <motion.div
                      className={`
                        group flex items-center gap-3 rounded-xl text-sm font-medium
                        transition-colors duration-150 relative
                        ${collapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2.5"}
                        ${isActive
                          ? "bg-primary text-white shadow-glow"
                          : "text-gray-500 hover:text-[#444] hover:bg-white hover:shadow-card"
                        }
                      `}
                      whileHover={{ x: isActive ? 0 : 2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      title={collapsed ? label : undefined}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="shrink-0"
                      >
                        <Icon size={17} aria-hidden="true" />
                      </motion.div>

                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 overflow-hidden whitespace-nowrap"
                          >
                            {label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {!collapsed && isActive && (
                        <motion.div
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 0.6, x: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight size={14} />
                        </motion.div>
                      )}

                      {/* Active indicator dot for collapsed state */}
                      {collapsed && isActive && (
                        <motion.div
                          layoutId="active-dot"
                          className="absolute -right-0.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary"
                        />
                      )}
                    </motion.div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className={`border-t border-gray-100 shrink-0 ${collapsed ? "px-2 py-4" : "px-5 py-4"}`}>
          <AnimatePresence>
            {!collapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-xs text-gray-400">System online</p>
                </div>
                <p className="mt-1 text-[10px] text-gray-300">© 2026 KALNET v2.0</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
}
