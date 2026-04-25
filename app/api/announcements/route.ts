import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { AnnouncementCategory } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as AnnouncementCategory | "All" | null;

  try {
    const announcements = await prisma.announcement.findMany({
      where: category && category !== "All" ? { category } : {},
      orderBy: { date: "desc" },
    });
    return NextResponse.json(announcements);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}
