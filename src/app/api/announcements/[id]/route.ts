import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  canManageAnnouncements,
  canViewAnnouncement,
  isValidTargetForRole,
} from "@/lib/announcements";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string } | undefined;
    const id = parseInt((await params).id);

    const announcement = await db.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    if (session && !canViewAnnouncement(user?.role, announcement.target)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Announcement GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string } | undefined;
    if (!session || !canManageAnnouncements(user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = parseInt((await params).id);
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

    const announcement = await db.announcement.update({
      where: { id },
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
    console.error("Announcement PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string } | undefined;
    if (!session || !canManageAnnouncements(user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = parseInt((await params).id);

    await db.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Announcement DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const PATCH = PUT;
