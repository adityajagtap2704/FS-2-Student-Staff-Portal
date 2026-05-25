import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  announcementReadFilter,
  canManageAnnouncements,
  isValidTargetForRole,
} from "@/lib/announcements";
import { prismaOrder } from "@/lib/sortOrder";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string } | undefined;
    const role = user?.role;

    const baseWhere: Record<string, unknown> = {};
    if (category && category !== "All") {
      baseWhere.category = category;
    }

    if (!canManageAnnouncements(role)) {
      Object.assign(baseWhere, announcementReadFilter(role));
    }

    const announcements = await db.announcement.findMany({
      where: baseWhere,
      orderBy: prismaOrder.announcement,
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Announcements API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; name?: string } | undefined;
    if (!session || !canManageAnnouncements(user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, category, target, description, author, date, imageUrl } = body;

    if (!title?.trim() || !category || !description?.trim() || !author?.trim() || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!isValidTargetForRole(user?.role, target)) {
      return NextResponse.json(
        { error: "Invalid audience. Choose Students or Teaching Staff." },
        { status: 400 }
      );
    }

    const announcement = await db.announcement.create({
      data: {
        title: title.trim(),
        category,
        target,
        description: description.trim(),
        author: author.trim(),
        date: new Date(date),
        imageUrl: imageUrl?.trim() || null,
      },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Announcement POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
