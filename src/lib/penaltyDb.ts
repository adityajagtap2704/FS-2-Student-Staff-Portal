import db from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Calculate and apply penalty for overdue fees
 * Penalty is applied only if:
 * 1. Fee is OVERDUE
 * 2. No installment plan is active
 * 3. Penalty hasn't been applied yet
 */
export async function applyPenaltyForOverdueFee(feeId: number): Promise<boolean> {
  try {
    const fee = await db.fee.findUnique({
      where: { id: feeId },
      include: {
        installmentRequest: true,
      },
    });

    if (!fee) {
      throw new Error("Fee not found");
    }

    // Don't apply penalty if fee is paid
    if (fee.status === "PAID") {
      return false;
    }

    // Don't apply penalty if installment plan is approved
    if (fee.installmentRequest?.status === "APPROVED") {
      return false;
    }

    // Don't apply penalty if already applied
    if (fee.penaltyAppliedAt) {
      return false;
    }

    // Calculate days overdue
    const now = new Date();
    const daysOverdue = Math.floor(
      (now.getTime() - fee.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only apply penalty if overdue by at least 1 day
    if (daysOverdue < 1) {
      return false;
    }

    // Calculate penalty amount (default 5% of fee amount)
    const penaltyPercentage = Number(fee.penaltyPercentage);
    const penaltyAmount = (Number(fee.amount) * penaltyPercentage) / 100;

    // Update fee with penalty
    await db.fee.update({
      where: { id: feeId },
      data: {
        penaltyAmount: new Prisma.Decimal(penaltyAmount.toFixed(2)),
        penaltyAppliedAt: now,
      },
    });

    // Log penalty
    await db.penaltyLog.create({
      data: {
        feeId,
        studentId: fee.studentId,
        penaltyAmount: new Prisma.Decimal(penaltyAmount.toFixed(2)),
        penaltyPercentage: new Prisma.Decimal(penaltyPercentage.toFixed(2)),
        daysOverdue,
        reason: `${daysOverdue} days overdue`,
      },
    });

    console.log(
      `[PENALTY] Applied ₹${penaltyAmount.toFixed(2)} penalty to fee ${feeId} (${daysOverdue} days overdue)`
    );

    return true;
  } catch (error) {
    console.error("[PENALTY] Error applying penalty:", error);
    throw error;
  }
}

/**
 * Apply penalties for all overdue fees without installment plans
 */
export async function applyPenaltiesForAllOverdueFees(): Promise<number> {
  try {
    const now = new Date();

    // Find all overdue fees without approved installment plans and without penalties
    const overdueFees = await db.fee.findMany({
      where: {
        status: "OVERDUE",
        dueDate: { lt: now },
        penaltyAppliedAt: null,
        installmentRequest: {
          status: { not: "APPROVED" },
        },
      },
      include: {
        installmentRequest: true,
      },
    });

    let penaltyCount = 0;

    for (const fee of overdueFees) {
      const applied = await applyPenaltyForOverdueFee(fee.id);
      if (applied) {
        penaltyCount++;
      }
    }

    console.log(`[PENALTY] Applied penalties to ${penaltyCount} fees`);
    return penaltyCount;
  } catch (error) {
    console.error("[PENALTY] Error applying penalties:", error);
    throw error;
  }
}

/**
 * Apply penalties for overdue installments
 */
export async function applyPenaltyForOverdueInstallment(
  installmentId: number
): Promise<boolean> {
  try {
    const installment = await db.installment.findUnique({
      where: { id: installmentId },
      include: { fee: true },
    });

    if (!installment) {
      throw new Error("Installment not found");
    }

    // Don't apply penalty if installment is paid
    if (installment.status === "PAID") {
      return false;
    }

    // Calculate days overdue
    const now = new Date();
    const daysOverdue = Math.floor(
      (now.getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only apply penalty if overdue by at least 1 day
    if (daysOverdue < 1) {
      return false;
    }

    // Calculate penalty amount (5% of installment amount)
    const penaltyPercentage = 5;
    const penaltyAmount = (Number(installment.amount) * penaltyPercentage) / 100;

    // Log penalty for installment
    await db.penaltyLog.create({
      data: {
        feeId: installment.feeId,
        studentId: installment.studentId,
        penaltyAmount: new Prisma.Decimal(penaltyAmount.toFixed(2)),
        penaltyPercentage: new Prisma.Decimal(penaltyPercentage.toFixed(2)),
        daysOverdue,
        reason: `Installment ${installment.installmentNumber} overdue by ${daysOverdue} days`,
      },
    });

    console.log(
      `[PENALTY] Applied ₹${penaltyAmount.toFixed(2)} penalty to installment ${installmentId}`
    );

    return true;
  } catch (error) {
    console.error("[PENALTY] Error applying installment penalty:", error);
    throw error;
  }
}

/**
 * Get penalty logs for a fee
 */
export async function getPenaltyLogsForFee(feeId: number) {
  try {
    const logs = await db.penaltyLog.findMany({
      where: { feeId },
      orderBy: { appliedAt: "desc" },
    });

    return logs;
  } catch (error) {
    console.error("[PENALTY] Error fetching penalty logs:", error);
    throw error;
  }
}

/**
 * Get total penalty amount for a student
 */
export async function getTotalPenaltyForStudent(studentId: number) {
  try {
    const result = await db.penaltyLog.aggregate({
      where: { studentId },
      _sum: { penaltyAmount: true },
    });

    return result._sum.penaltyAmount || new Prisma.Decimal(0);
  } catch (error) {
    console.error("[PENALTY] Error calculating total penalty:", error);
    throw error;
  }
}

/**
 * Waive penalty (HOD action)
 */
export async function waivePenalty(input: {
  feeId: number;
  reason: string;
}) {
  try {
    const fee = await db.fee.update({
      where: { id: input.feeId },
      data: {
        penaltyAmount: new Prisma.Decimal(0),
        penaltyAppliedAt: null,
      },
    });

    // Log the waiver
    await db.penaltyLog.create({
      data: {
        feeId: input.feeId,
        studentId: fee.studentId,
        penaltyAmount: new Prisma.Decimal(0),
        penaltyPercentage: new Prisma.Decimal(0),
        daysOverdue: 0,
        reason: `Penalty waived: ${input.reason}`,
      },
    });

    return fee;
  } catch (error) {
    console.error("[PENALTY] Error waiving penalty:", error);
    throw error;
  }
}
