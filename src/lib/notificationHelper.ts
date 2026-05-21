import db from "@/lib/db";
import { NotificationType } from "@prisma/client";

/**
 * Phase 2: Create notification with duplicate prevention
 * Prevents duplicate notifications of the same type for the same student
 * within a specified time window (default: 1 hour)
 */
export async function createNotificationNoDuplicates(
  studentId: number,
  type: NotificationType,
  title: string,
  message: string,
  timeWindowMinutes: number = 60
): Promise<any> {
  try {
<<<<<<< HEAD
    // Check for recent duplicate — match on type AND title to avoid cross-topic suppression
=======
    // Check for recent duplicate notification
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
    const recentNotification = await db.notification.findFirst({
      where: {
        studentId,
        type,
<<<<<<< HEAD
        title,
=======
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
        createdAt: {
          gte: new Date(Date.now() - timeWindowMinutes * 60 * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
    });

<<<<<<< HEAD
    // If exact duplicate found within time window, return existing notification
    if (recentNotification) {
      console.log(
        `[NOTIFICATION] Duplicate prevented for student ${studentId}, type ${type}, title "${title}"`
=======
    // If duplicate found within time window, return existing notification
    if (recentNotification) {
      console.log(
        `[NOTIFICATION] Duplicate prevented for student ${studentId}, type ${type}`
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
      );
      return recentNotification;
    }

    // Create new notification
    const notification = await db.notification.create({
      data: {
        studentId,
        type,
        title,
        message,
      },
    });

    console.log(
<<<<<<< HEAD
      `[NOTIFICATION] Created notification for student ${studentId}, type ${type}, title "${title}"`
=======
      `[NOTIFICATION] Created notification for student ${studentId}, type ${type}`
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
    );
    return notification;
  } catch (error) {
    console.error("[NOTIFICATION] Error creating notification:", error);
    throw error;
  }
}

/**
 * Create multiple notifications with duplicate prevention
 */
export async function createNotificationsNoDuplicates(
  notifications: Array<{
    studentId: number;
    type: NotificationType;
    title: string;
    message: string;
  }>,
  timeWindowMinutes: number = 60
): Promise<any[]> {
  const results = [];
  for (const notif of notifications) {
    const result = await createNotificationNoDuplicates(
      notif.studentId,
      notif.type,
      notif.title,
      notif.message,
      timeWindowMinutes
    );
    results.push(result);
  }
  return results;
}
