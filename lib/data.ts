import { AnnouncementCategory as PrismaCategory } from "@prisma/client";

export type AnnouncementCategory = PrismaCategory | "All";

export interface Announcement {
  id: string;
  title: string;
  category: PrismaCategory;
  description: string;
  date: string;
  author: string;
  imageUrl?: string;
}

// Announcements are now fetched from the database via /api/announcements
// The hardcoded announcements array has been removed to ensure data integrity.
