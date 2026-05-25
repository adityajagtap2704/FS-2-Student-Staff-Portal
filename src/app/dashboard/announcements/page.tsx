import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import AnnouncementsClient from "./AnnouncementsClient";
import db from "@/lib/db";
import {
  announcementReadFilter,
  canManageAnnouncements,
} from "@/lib/announcements";
import { prismaOrder } from "@/lib/sortOrder";

export default async function AnnouncementsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as { role?: string; name?: string };
  const role = user?.role;
  const canManage = canManageAnnouncements(role);

  const announcements = await db.announcement.findMany({
    where: canManage ? {} : announcementReadFilter(role),
    orderBy: prismaOrder.announcement,
  });

  return (
    <PageLayout session={session} title="Announcements">
      <AnnouncementsClient
        announcements={announcements}
        canManage={canManage}
        role={role ?? "STUDENT"}
        userName={user?.name ?? ""}
        manageAnnouncements={canManage ? announcements : []}
      />
    </PageLayout>
  );
}
