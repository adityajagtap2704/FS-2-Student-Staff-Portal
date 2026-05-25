import db from "@/lib/db";

/**
 * Phase 2: Create notification with duplicate prevention
 * Prevents duplicate notifications of the same type for the same student
 * within a specified time window (default: 1 hour)
 */
export async function createNotificationNoDuplicates(
  studentId: number,
  type: string,
  title: string,
  message: string,
  timeWindowMinutes: number = 60
): Promise<any> {
  try {
    // Check for recent duplicate — match on type AND title to avoid cross-topic suppression
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

    // If exact duplicate found within time window, return existing notification
    if (recentNotification) {
      console.log(
        `[NOTIFICATION] Duplicate prevented for student ${studentId}, type ${type}, title "${title}"`
      );
      return recentNotification;
    }

    // Create new notification
    const notification = await db.notification.create({
      data: {
        studentId,
        type: type as any,
        title,
        message,
      },
    });

    console.log(
      `[NOTIFICATION] Created notification for student ${studentId}, type ${type}, title "${title}"`
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
    type: string;
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
