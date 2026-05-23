import db from "@/lib/db";
import { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  studentId: number;
  type: NotificationType;
  title: string;
  message: string;
}

/**
 * Create a notification for a student
 */
export async function createNotification({
  studentId,
  type,
  title,
  message,
}: CreateNotificationParams) {
  try {
    const notification = await db.notification.create({
      data: {
        studentId,
        type,
        title,
        message,
      },
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Create admission approval notification
 */
export async function notifyAdmissionApproved(
  studentId: number,
  enquiryNumber: string,
  rollNumber: string
) {
  return createNotification({
    studentId,
    type: "ADMISSION_APPROVED",
    title: "Admission Approved",
    message: `Congratulations! Your admission has been approved. Your enquiry number is ${enquiryNumber} and your roll number is ${rollNumber}. You can now access the full student portal.`,
  });
}

/**
 * Create admission rejection notification
 */
export async function notifyAdmissionRejected(
  studentId: number,
  enquiryNumber: string,
  reason?: string
) {
  const reasonText = reason ? ` Reason: ${reason}` : "";
  return createNotification({
    studentId,
    type: "ADMISSION_REJECTED",
    title: "Admission Status Update",
    message: `Your admission application (${enquiryNumber}) has been reviewed.${reasonText} Please contact the admissions office for more information.`,
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number) {
  return db.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

/**
 * Mark all notifications as read for a student
 */
export async function markAllNotificationsAsRead(studentId: number) {
  return db.notification.updateMany({
    where: { studentId },
    data: { isRead: true },
  });
}
