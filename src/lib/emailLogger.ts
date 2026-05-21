import db from "@/lib/db";

export interface EmailLogData {
  recipientEmail: string;
  subject: string;
  emailType: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  status?: "SENT" | "FAILED" | "BOUNCED";
  errorMessage?: string;
}

/**
 * Log email send to database
 */
export async function logEmail(data: EmailLogData): Promise<void> {
  try {
    await db.emailLog.create({
      data: {
        recipientEmail: data.recipientEmail,
        subject: data.subject,
        emailType: data.emailType,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        status: data.status || "SENT",
        errorMessage: data.errorMessage,
      },
    });
  } catch (error) {
    console.error("Failed to log email:", error);
    // Don't throw - logging failure shouldn't break email sending
  }
}

/**
 * Log email send with error handling
 */
export async function logEmailSafe(data: EmailLogData): Promise<void> {
  try {
    await logEmail(data);
  } catch (error) {
    console.error("Email logging error (non-critical):", error);
  }
}
