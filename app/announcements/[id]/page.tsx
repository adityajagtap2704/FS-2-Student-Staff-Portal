"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User, ChevronRight, Share2, Loader2 } from "lucide-react";

import { Announcement } from "@prisma/client";

export default function AnnouncementDetailPage({ params }: { params: { id: string } }) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [related, setRelated] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/announcements/${params.id}`);
        if (!res.ok) { setAnnouncement(null); return; }
        const data = await res.json();
        setAnnouncement(data);

        // Fetch related (same category)
        const relRes = await fetch(`/api/announcements?category=${data.category}`);
        const relData = await relRes.json();
        setRelated(relData.filter((a: any) => a.id !== data.id).slice(0, 3));
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
    </div>
  );

  if (!announcement) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header Back Link */}
      <div className="bg-white border-b border-gray-100 pt-8 pb-4 px-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/announcements"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors font-medium group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Announcements
          </Link>
          <button className="h-9 w-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        <article className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm">
          {/* Category Badge */}
          <div className="mb-6">
            <span className={`
              text-sm font-semibold px-4 py-1.5 rounded-full inline-block
              ${announcement.category === "Events" ? "bg-amber-100 text-amber-700" : ""}
              ${announcement.category === "Exams" ? "bg-red-100 text-red-700" : ""}
              ${announcement.category === "Holidays" ? "bg-emerald-100 text-emerald-700" : ""}
              ${announcement.category === "General" ? "bg-blue-100 text-blue-700" : ""}
            `}>
              {announcement.category}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {announcement.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-500 font-medium mb-10 pb-8 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center">
                <Calendar size={14} className="text-primary-600" />
              </div>
              {new Date(announcement.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center">
                <User size={14} className="text-gray-600" />
              </div>
              {announcement.author}
            </div>
          </div>

          {/* Featured Image if exists */}
          {announcement.imageUrl && (
            <div className="w-full h-64 sm:h-96 bg-gray-100 rounded-2xl mb-10 overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={announcement.imageUrl} 
                alt={announcement.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="prose prose-lg prose-blue max-w-none text-gray-600">
            {announcement.description.split('\n').map((paragraph: string, index: number) => (
              <p key={index} className="mb-4 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </article>

        {/* Related Announcements */}
        {related.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              Related Announcements
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((item) => (
                <Link 
                  href={`/announcements/${item.id}`} 
                  key={item.id}
                  className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-100 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md">
                      {item.category}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="flex items-center text-xs font-semibold text-primary mt-4">
                    Read article <ChevronRight size={14} className="ml-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
