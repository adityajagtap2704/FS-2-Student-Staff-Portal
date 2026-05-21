import db from "@/lib/db";

export interface WebhookLogData {
  event: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  payload: any;
  status?: "PENDING" | "PROCESSED" | "FAILED";
  errorMessage?: string;
}

/**
 * Log webhook event to database
 */
export async function logWebhook(data: WebhookLogData): Promise<void> {
  try {
    await db.paymentWebhookLog.create({
      data: {
        event: data.event,
        razorpayOrderId: data.razorpayOrderId,
        razorpayPaymentId: data.razorpayPaymentId,
        payload: typeof data.payload === "string" ? data.payload : JSON.stringify(data.payload),
        status: data.status || "PENDING",
        errorMessage: data.errorMessage,
      },
    });
  } catch (error) {
    console.error("Failed to log webhook:", error);
    // Don't throw - logging failure shouldn't break webhook processing
  }
}

/**
 * Log webhook with error handling
 */
export async function logWebhookSafe(data: WebhookLogData): Promise<void> {
  try {
    await logWebhook(data);
  } catch (error) {
    console.error("Webhook logging error (non-critical):", error);
  }
}

/**
 * Update webhook log status
 */
export async function updateWebhookLogStatus(
  razorpayOrderId: string,
  status: "PROCESSED" | "FAILED",
  errorMessage?: string
): Promise<void> {
  try {
    await db.paymentWebhookLog.updateMany({
      where: { razorpayOrderId },
      data: {
        status,
        errorMessage,
        processedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to update webhook log:", error);
  }
}
