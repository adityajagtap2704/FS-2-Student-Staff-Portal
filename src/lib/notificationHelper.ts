import db from "@/lib/db";
import { notifications_type } from "@prisma/client";

export async function createNotificationNoDuplicates(
  studentId: number,
  type: notifications_type,
  title: string,
  message: string,
  timeWindowMinutes: number = 60
): Promise<any> {
  try {
    const recentNotification = await db.notification.findFirst({
      where: {
        studentId,
        type: type as any,
        title,
        createdAt: {
          gte: new Date(Date.now() - timeWindowMinutes * 60 * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentNotification) {
      console.log(`[NOTIFICATION] Duplicate prevented for student ${studentId}, type ${type}`);
      return recentNotification;
    }

    const notification = await db.notification.create({
      data: { studentId, type, title, message },
    });

    console.log(`[NOTIFICATION] Created for student ${studentId}, type ${type}`);
    return notification;
  } catch (error) {
    console.error("[NOTIFICATION] Error:", error);
    throw error;
  }
}

export async function createNotificationsNoDuplicates(
  notifications: Array<{
    studentId: number;
    type: notifications_type;
    title: string;
    message: string;
  }>,
  timeWindowMinutes: number = 60
): Promise<any[]> {
  const results = [];
  for (const notif of notifications) {
    const result = await createNotificationNoDuplicates(
      notif.studentId, notif.type, notif.title, notif.message, timeWindowMinutes
    );
    results.push(result);
  }
  return results;
}
