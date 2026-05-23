"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Calendar, ChevronRight, Filter, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["All", "Events", "Exams", "Holidays", "General"];

const categoryMeta: Record<string, { bg: string; text: string; placeholder: string; emoji: string; border: string }> = {
  Events:   { bg: "bg-amber-100",  text: "text-amber-700",   placeholder: "bg-amber-50",   emoji: "🎉", border: "border-amber-100"  },
  Exams:    { bg: "bg-red-100",    text: "text-red-700",     placeholder: "bg-red-50",     emoji: "📝", border: "border-red-100"    },
  Holidays: { bg: "bg-emerald-100",text: "text-emerald-700", placeholder: "bg-emerald-50", emoji: "🌴", border: "border-emerald-100"},
  General:  { bg: "bg-blue-100",   text: "text-blue-700",    placeholder: "bg-blue-50",    emoji: "📢", border: "border-blue-100"   },
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="w-full h-44 bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-24 bg-gray-100 rounded-full" />
        <div className="h-5 w-3/4 bg-gray-100 rounded-full" />
        <div className="h-3 w-full bg-gray-100 rounded-full" />
        <div className="h-3 w-2/3 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = activeCategory === "All" ? "/api/announcements" : `/api/announcements?category=${activeCategory}`;
    fetch(url)
      .then(res => res.json())
      .then(data => { setAnnouncements(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">

      {/* ── Sticky Header ── */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 pt-8 pb-6 px-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors font-medium group mb-5"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
          <div className="flex items-end gap-3">
            <div className="inline-flex h-10 w-10 rounded-xl bg-primary-50 items-center justify-center shrink-0">
              <Bell size={20} className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Announcements Board</h1>
              <p className="mt-0.5 text-sm text-gray-500">Latest news, events, and notices from KALNET.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8">

        {/* ── Category Tabs ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide mb-8">
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 shrink-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 whitespace-nowrap
                  ${activeCategory === cat ? "text-white" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
              >
                {activeCategory === cat && (
                  <motion.div
                    layoutId="activeCategoryTab"
                    className="absolute inset-0 bg-gradient-primary shadow-md shadow-primary/20"
                    style={{ borderRadius: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </motion.div>
          ) : announcements.length > 0 ? (
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {announcements.map((a, i) => {
                const meta = categoryMeta[a.category] ?? categoryMeta["General"];
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <Link
                      href={`/announcements/${a.id}`}
                      className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all duration-300 flex flex-col h-full overflow-hidden"
                    >
                      {/* Image */}
                      <div className="relative w-full h-44 overflow-hidden shrink-0">
                        {a.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={a.imageUrl}
                            alt={a.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className={`w-full h-full ${meta.placeholder} flex items-center justify-center`}>
                            <span className="text-6xl opacity-20">{meta.emoji}</span>
                          </div>
                        )}
                        {/* Gradient overlay for readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        {/* Category badge */}
                        <span className={`absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm ${meta.bg} ${meta.text}`}>
                          {meta.emoji} {a.category}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="flex flex-col flex-1 p-5">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar size={11} />
                            {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400 truncate max-w-[120px]">
                            <User size={11} className="shrink-0" />
                            <span className="truncate">{a.author}</span>
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {a.title}
                        </h3>

                        <p className="text-sm text-gray-500 flex-1 leading-relaxed line-clamp-2">
                          {a.description}
                        </p>

                        <div className="mt-4 flex items-center justify-between text-sm font-medium pt-4 border-t border-gray-50">
                          <span className="text-primary group-hover:text-primary-600 transition-colors text-xs font-semibold">
                            Read more
                          </span>
                          <div className="h-7 w-7 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary transition-colors">
                            <ChevronRight size={14} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm text-center"
            >
              <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Filter size={24} className="text-gray-300" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No announcements found</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">
                No announcements in this category yet.
              </p>
              <button
                onClick={() => setActiveCategory("All")}
                className="mt-5 px-5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Show all
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
