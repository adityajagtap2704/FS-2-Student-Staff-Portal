"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { ArrowRight, Megaphone } from "lucide-react";
import { staggerContainer, staggerItem, easeOut } from "@/components/motion/MotionConfig";

type Category = "Events" | "Exams" | "Holidays" | "General";

interface Announcement {
  id: number;
  title: string;
  description: string;
  category: Category;
  author: string;
  date: Date;
  imageUrl: string | null;
  createdAt: Date;
}

interface Props {
  announcements: Announcement[];
}

const categoryConfig: Record<Category, { variant: "info" | "warning" | "success" | "primary" | "purple" | "neutral"; emoji: string }> = {
  Events:   { variant: "info",    emoji: "🎉" },
  Exams:    { variant: "warning", emoji: "📝" },
  Holidays: { variant: "success", emoji: "🌴" },
  General:  { variant: "neutral", emoji: "📢" },
};

const allCategories: Category[] = ["Events", "Exams", "Holidays", "General"];

// The two most recent announcements are treated as "pinned/featured"
const PINNED_COUNT = 2;

export default function AnnouncementsClient({ announcements }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const filtered = activeCategory
    ? announcements.filter((a) => a.category === activeCategory)
    : announcements;

  const pinned = filtered.slice(0, PINNED_COUNT);
  const rest   = filtered.slice(PINNED_COUNT);

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-5">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeOut}
      >
        <div>
          <h1 className="text-2xl font-bold text-[#444] tracking-tight">Announcements</h1>
          <p className="mt-1 text-sm text-gray-400">Stay up to date with the latest school notices.</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <motion.button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${!activeCategory ? "bg-primary text-white shadow-glow" : "bg-white border border-gray-200 text-gray-500 hover:border-primary hover:text-primary"}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            All
          </motion.button>
          {allCategories.map((cat) => {
            const cfg = categoryConfig[cat];
            const isActive = activeCategory === cat;
            return (
              <motion.button
                key={cat}
                onClick={() => setActiveCategory(isActive ? null : cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${isActive ? "bg-primary text-white shadow-glow" : "bg-white border border-gray-200 text-gray-500 hover:border-primary hover:text-primary hover:bg-primary-50"}`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {cfg.emoji} {cat}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory ?? "all"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={easeOut}
          className="space-y-5"
        >
          {/* Featured / Pinned */}
          {pinned.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Latest
              </p>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {pinned.map((a, i) => {
                  const cfg = categoryConfig[a.category];
                  return (
                    <motion.div key={a.id} variants={staggerItem} transition={{ ...easeOut, delay: i * 0.06 }}>
                      <Link href={`/dashboard/announcements/${a.id}`}>
                        <motion.div
                          className="group block bg-white rounded-2xl border border-primary-100 shadow-glow overflow-hidden cursor-pointer"
                          whileHover={{ y: -3, boxShadow: "0 12px 40px rgba(29,158,117,0.15)" }}
                          whileTap={{ scale: 0.99 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          {/* Image / placeholder */}
                          <div className="relative w-full h-44 overflow-hidden">
                            {a.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={a.imageUrl}
                                alt={a.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary-50 flex items-center justify-center">
                                <span className="text-5xl opacity-20">{cfg.emoji}</span>
                              </div>
                            )}
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                          </div>
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <Badge variant={cfg.variant}>{cfg.emoji} {a.category}</Badge>
                              <span className="text-[10px] text-gray-300 shrink-0">{formatDate(a.date)}</span>
                            </div>
                            <h3 className="font-semibold text-[#444] text-sm leading-snug group-hover:text-primary transition-colors">
                              {a.title}
                            </h3>
                            <p className="mt-1.5 text-xs text-gray-400 line-clamp-2">{a.description}</p>
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-[10px] text-gray-300">{a.author}</span>
                              <motion.div
                                className="flex items-center gap-1 text-xs text-primary font-medium"
                                initial={{ opacity: 0.6, x: -2 }}
                                whileHover={{ opacity: 1, x: 0 }}
                              >
                                Read more <ArrowRight size={12} />
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                All Announcements
              </p>
              <motion.div
                className="space-y-2"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {rest.map((a, i) => {
                  const cfg = categoryConfig[a.category];
                  return (
                    <motion.div key={a.id} variants={staggerItem} transition={{ ...easeOut, delay: i * 0.05 }}>
                      <Link href={`/dashboard/announcements/${a.id}`}>
                        <motion.div
                          className="group flex items-start gap-4 bg-white rounded-2xl border border-gray-100 shadow-card p-4 cursor-pointer overflow-hidden"
                          whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.07)" }}
                          whileTap={{ scale: 0.99 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          {/* Thumbnail */}
                          <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0">
                            {a.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={a.imageUrl}
                                alt={a.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <motion.div
                                className="h-full w-full bg-gray-50 flex items-center justify-center text-lg"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                              >
                                {cfg.emoji}
                              </motion.div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge variant={cfg.variant} size="sm">{a.category}</Badge>
                              <span className="text-[10px] text-gray-300">{formatDate(a.date)}</span>
                            </div>
                            <h3 className="text-sm font-semibold text-[#444] group-hover:text-primary transition-colors truncate">{a.title}</h3>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{a.description}</p>
                          </div>
                          <motion.div
                            className="text-gray-300 group-hover:text-primary shrink-0 mt-1 transition-colors"
                            whileHover={{ x: 3 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          >
                            <ArrowRight size={16} />
                          </motion.div>
                        </motion.div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          )}

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <Megaphone size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">No announcements in this category</p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
