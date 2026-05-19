import db from "@/lib/db";
import { applyPenaltyForOverdueFee } from "@/lib/penaltyDb";

/**
 * Phase 2: Automatic OVERDUE fee status update
 * Updates fees to OVERDUE if:
 * 1. Status is PENDING
 * 2. Due date has passed
 * 3. Amount is not fully paid
 * 4. No approved installment plan exists
 */
export async function updateOverdueFees(): Promise<number> {
  try {
    const now = new Date();
    
    // Find all PENDING fees with past due dates and no approved installment plans
    const overdueFees = await db.fee.findMany({
      where: {
        status: "PENDING",
        dueDate: { lt: now },
        paidAmount: { lt: db.fee.fields.amount },
        installmentRequest: {
          status: { not: "APPROVED" },
        },
      },
    });

    if (overdueFees.length === 0) {
      return 0;
    }

    // Update all overdue fees to OVERDUE status
    const result = await db.fee.updateMany({
      where: {
        status: "PENDING",
        dueDate: { lt: now },
        paidAmount: { lt: db.fee.fields.amount },
        installmentRequest: {
          status: { not: "APPROVED" },
        },
      },
      data: {
        status: "OVERDUE",
      },
    });

    console.log(`[FEE STATUS] Updated ${result.count} fees to OVERDUE status`);

    // Apply penalties to overdue fees
    for (const fee of overdueFees) {
      await applyPenaltyForOverdueFee(fee.id);
    }

    return result.count;
  } catch (error) {
    console.error("[FEE STATUS] Error updating overdue fees:", error);
    return 0;
  }
}

/**
 * Get fee status with automatic OVERDUE update
 * Call this before returning fees to ensure status is current
 */
export async function getFeeWithUpdatedStatus(feeId: number) {
  try {
    const fee = await db.fee.findUnique({
      where: { id: feeId },
      include: { installmentRequest: true },
    });

    if (!fee) return null;

    // Check if should be OVERDUE
    const now = new Date();
    if (
      fee.status === "PENDING" &&
      fee.dueDate < now &&
      Number(fee.paidAmount) < Number(fee.amount) &&
      fee.installmentRequest?.status !== "APPROVED"
    ) {
      // Update to OVERDUE
      const updated = await db.fee.update({
        where: { id: feeId },
        data: { status: "OVERDUE" },
      });

      // Apply penalty
      await applyPenaltyForOverdueFee(feeId);

      return updated;
    }

    return fee;
  } catch (error) {
    console.error("[FEE STATUS] Error getting fee with updated status:", error);
    return null;
  }
}
