"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCircle2, XCircle, Info } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { easeOut, staggerContainer, staggerItem } from "@/components/motion/MotionConfig";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const typeConfig: Record<string, {
  icon: typeof Bell;
  color: string;
  bg: string;
  variant: "success" | "danger" | "info" | "neutral";
  label: string;
}> = {
  LEAVE_APPROVED:     { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", variant: "success", label: "Approved"  },
  LEAVE_REJECTED:     { icon: XCircle,      color: "text-red-500",     bg: "bg-red-50",     variant: "danger",  label: "Rejected"  },
  ADMISSION_APPROVED: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", variant: "success", label: "Approved"  },
  ADMISSION_REJECTED: { icon: XCircle,      color: "text-red-500",     bg: "bg-red-50",     variant: "danger",  label: "Rejected"  },
  GENERAL:            { icon: Info,         color: "text-blue-500",    bg: "bg-blue-50",    variant: "info",    label: "Notice"    },
};

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => { setNotifications(d.notifications ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const markRead = async (id: number) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => fetch(`/api/notifications/${n.id}`, { method: "PATCH" })));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeOut}
      >
        <div>
          <h1 className="text-2xl font-bold text-[#444] tracking-tight flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold"
              >
                {unreadCount}
              </motion.span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-400">Your latest updates and alerts.</p>
        </div>
        {unreadCount > 0 && (
          <motion.button
            onClick={markAllRead}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="text-xs text-primary hover:text-primary-600 font-medium transition-colors px-3 py-1.5 rounded-xl border border-primary-100 hover:bg-primary-50"
          >
            Mark all as read
          </motion.button>
        )}
      </motion.div>

      {/* Loading skeletons */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3 animate-pulse">
              <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>

      /* Empty state */
      ) : notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-card"
        >
          <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-gray-200" />
          </div>
          <p className="text-sm font-semibold text-gray-400">No notifications yet</p>
          <p className="text-xs text-gray-300 mt-1">You&apos;ll see leave updates and alerts here.</p>
        </motion.div>

      /* Notification list */
      ) : (
        <motion.div
          className="space-y-2"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {notifications.map((n, i) => {
            const cfg = typeConfig[n.type] ?? typeConfig.GENERAL;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={n.id}
                variants={staggerItem}
                transition={{ ...easeOut, delay: i * 0.04 }}
                onClick={() => !n.isRead && markRead(n.id)}
                whileHover={{ y: -1 }}
                className={`flex items-start gap-4 bg-white rounded-2xl border p-4 cursor-pointer transition-all duration-150 ${
                  n.isRead
                    ? "border-gray-100 opacity-60 hover:opacity-80"
                    : "border-primary-100 shadow-glow hover:shadow-card"
                }`}
              >
                {/* Icon */}
                <div className={`h-10 w-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={cfg.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-[#444]">{n.title}</p>
                    {!n.isRead && (
                      <motion.span
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="h-2 w-2 rounded-full bg-primary shrink-0"
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-gray-300 mt-1.5">
                    {new Date(n.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(n.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Badge */}
                <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
