import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { ArrowLeft, Calendar, User, ChevronRight } from "lucide-react";
import db from "@/lib/db";

type Category = "Events" | "Exams" | "Holidays" | "General";

const categoryConfig: Record<Category, { variant: "info" | "warning" | "success" | "neutral"; emoji: string; placeholder: string }> = {
  Events:   { variant: "info",    emoji: "🎉", placeholder: "bg-blue-50"    },
  Exams:    { variant: "warning", emoji: "📝", placeholder: "bg-amber-50"   },
  Holidays: { variant: "success", emoji: "🌴", placeholder: "bg-emerald-50" },
  General:  { variant: "neutral", emoji: "📢", placeholder: "bg-gray-50"    },
};

export default async function AnnouncementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const annId = parseInt(params.id);
  if (isNaN(annId)) notFound();

  const announcement = await db.announcement.findUnique({ where: { id: annId } });
  if (!announcement) notFound();

  const related = await db.announcement.findMany({
    where: { category: announcement.category, id: { not: announcement.id } },
    orderBy: { date: "desc" },
    take: 3,
  });

  const cfg = categoryConfig[announcement.category as Category];

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <PageLayout session={session} title="Announcement">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

        {/* Back */}
        <Link
          href="/dashboard/announcements"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Announcements
        </Link>

        {/* Article */}
        <article className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">

          {/* Hero image */}
          <div className="relative w-full h-52 sm:h-64 overflow-hidden">
            {announcement.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={announcement.imageUrl}
                alt={announcement.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full ${cfg.placeholder} flex items-center justify-center`}>
                <span className="text-7xl opacity-20">{cfg.emoji}</span>
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {/* Badge on image */}
            <div className="absolute bottom-4 left-5">
              <Badge variant={cfg.variant}>{cfg.emoji} {announcement.category}</Badge>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <h1 className="text-xl sm:text-2xl font-bold text-[#444] leading-snug mb-3">
              {announcement.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-6 pb-6 border-b border-gray-50">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {formatDate(announcement.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <User size={12} />
                {announcement.author}
              </span>
            </div>

            <div className="space-y-3">
              {announcement.description.split("\n").map((para, i) =>
                para.trim() ? (
                  <p key={i} className="text-sm text-gray-600 leading-relaxed">
                    {para}
                  </p>
                ) : null
              )}
            </div>
          </div>
        </article>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              More Announcements
            </p>
            <div className="space-y-2">
              {related.map((a) => {
                const relCfg = categoryConfig[a.category as Category];
                return (
                  <Link
                    key={a.id}
                    href={`/dashboard/announcements/${a.id}`}
                    className="group flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-card p-3 hover:shadow-soft hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0">
                      {a.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.imageUrl}
                          alt={a.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className={`w-full h-full ${relCfg.placeholder} flex items-center justify-center`}>
                          <span className="text-xl">{relCfg.emoji}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#444] group-hover:text-primary transition-colors truncate">
                        {a.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(a.date)}</p>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
