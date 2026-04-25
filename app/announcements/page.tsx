"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Calendar, ChevronRight, Filter, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Announcement, AnnouncementCategory } from "@prisma/client";

const CATEGORIES: (AnnouncementCategory | "All")[] = ["All", "Events", "Exams", "Holidays", "General"];

export default function AnnouncementsPage() {
  const [activeCategory, setActiveCategory] = useState<AnnouncementCategory | "All">("All");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      setLoading(true);
      try {
        const res = await fetch(`/api/announcements?category=${activeCategory}`);
        const data = await res.json();
        setAnnouncements(data);
      } catch (error) {
        console.error("Failed to fetch:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-8 pb-6 px-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors font-medium group mb-6"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex h-10 w-10 rounded-xl bg-primary-50 items-center justify-center mb-3">
                <Bell size={20} className="text-primary-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Announcements Board</h1>
              <p className="mt-1 text-gray-500">
                Stay updated with the latest news, events, and notices from KALNET.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide mb-8">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 shrink-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-300 whitespace-nowrap
                  ${activeCategory === cat 
                    ? "text-white" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}
                `}
              >
                {activeCategory === cat && (
                  <motion.div
                    layoutId="activeCategoryTab"
                    className="absolute inset-0 bg-gradient-primary shadow-md shadow-primary/20"
                    style={{ borderRadius: 12 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Announcements Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : announcements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {announcements.map((announcement) => (
              <Link 
                href={`/announcements/${announcement.id}`} 
                key={announcement.id}
                className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all duration-300 flex flex-col h-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`
                    text-xs font-semibold px-3 py-1 rounded-full
                    ${announcement.category === "Events" ? "bg-amber-100 text-amber-700" : ""}
                    ${announcement.category === "Exams" ? "bg-red-100 text-red-700" : ""}
                    ${announcement.category === "Holidays" ? "bg-emerald-100 text-emerald-700" : ""}
                    ${announcement.category === "General" ? "bg-blue-100 text-blue-700" : ""}
                  `}>
                    {announcement.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                    <Calendar size={13} />
                    {new Date(announcement.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {announcement.title}
                </h3>
                
                <p className="text-sm text-gray-500 mb-6 flex-1 leading-relaxed">
                  {announcement.description.length > 60 
                    ? announcement.description.substring(0, 60).trim() + "..." 
                    : announcement.description}
                </p>

                <div className="mt-auto flex items-center justify-between text-sm font-medium pt-4 border-t border-gray-50">
                  <span className="text-primary group-hover:text-primary-600 transition-colors">Read more</span>
                  <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Filter size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No announcements found</h3>
            <p className="text-gray-500 mt-1 max-w-sm">
              We couldn&apos;t find any announcements matching the selected category. Please try a different filter.
            </p>
            <button 
              onClick={() => setActiveCategory("All")}
              className="mt-6 px-6 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
