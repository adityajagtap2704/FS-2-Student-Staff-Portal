"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export const dynamic = "force-dynamic";

export default function AnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [announcement, setAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/announcements/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Announcement not found");
        return res.json();
      })
      .then(data => {
        setAnnouncement(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full rounded-2xl mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#444] mb-2">Announcement Not Found</h1>
          <p className="text-gray-400 mb-6">{error || "The announcement you're looking for doesn't exist."}</p>
          <Link href="/announcements">
            <Button icon={<ArrowLeft size={14} />}>Back to Announcements</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <Link href="/announcements" className="inline-flex items-center gap-2 text-primary hover:text-primary-600 font-medium mb-6 transition-colors">
          <ArrowLeft size={16} />
          Back to Announcements
        </Link>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Image */}
          {announcement.imageUrl && (
            <div className="h-96 w-full overflow-hidden bg-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={announcement.imageUrl}
                alt={announcement.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary-50 text-primary">
                  {announcement.category}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-[#444] mb-4">{announcement.title}</h1>

              {/* Meta info */}
              <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  <span>{announcement.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  <span>{new Date(announcement.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 my-6" />

            {/* Description */}
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{announcement.description}</p>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Posted on {new Date(announcement.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
