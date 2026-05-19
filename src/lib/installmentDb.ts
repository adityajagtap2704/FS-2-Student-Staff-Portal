import db from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Create installment request for a fee
 * Student requests to split payment into installments
 */
export async function createInstallmentRequest(input: {
  feeId: number;
  studentId: number;
  numberOfInstallments: number;
  reason: string;
}) {
  try {
    // Check if fee exists and is not already paid
    const fee = await db.fee.findUnique({
      where: { id: input.feeId },
    });

    if (!fee) {
      throw new Error("Fee not found");
    }

    if (fee.status === "PAID") {
      throw new Error("Cannot request installment for paid fee");
    }

    // Check if request already exists
    const existingRequest = await db.installmentRequest.findUnique({
      where: { feeId: input.feeId },
    });

    if (existingRequest) {
      throw new Error("Installment request already exists for this fee");
    }

    // Create installment request
    const request = await db.installmentRequest.create({
      data: {
        feeId: input.feeId,
        studentId: input.studentId,
        numberOfInstallments: input.numberOfInstallments,
        reason: input.reason,
        status: "PENDING",
      },
    });

    return request;
  } catch (error) {
    console.error("[INSTALLMENT] Error creating request:", error);
    throw error;
  }
}

/**
 * Get installments for a fee
 */
export async function getInstallmentsForFee(feeId: number) {
  try {
    const installments = await db.installment.findMany({
      where: { feeId },
      orderBy: { installmentNumber: "asc" },
    });

    return installments;
  } catch (error) {
    console.error("[INSTALLMENT] Error fetching installments:", error);
    throw error;
  }
}

/**
 * Get installment request for a fee
 */
export async function getInstallmentRequest(feeId: number) {
  try {
    const request = await db.installmentRequest.findUnique({
      where: { feeId },
    });

    return request;
  } catch (error) {
    console.error("[INSTALLMENT] Error fetching request:", error);
    throw error;
  }
}

/**
 * Update installment payment
 */
export async function updateInstallmentPayment(input: {
  installmentId: number;
  paidAmount: number;
  paymentMethod: string;
}) {
  try {
    const installment = await db.installment.findUnique({
      where: { id: input.installmentId },
    });

    if (!installment) {
      throw new Error("Installment not found");
    }

    const newPaidAmount = Number(installment.paidAmount) + input.paidAmount;
    const totalAmount = Number(installment.amount);

    const status = newPaidAmount >= totalAmount ? "PAID" : "PENDING";

    const updated = await db.installment.update({
      where: { id: input.installmentId },
      data: {
        paidAmount: new Prisma.Decimal(newPaidAmount.toFixed(2)),
        status,
        paymentMethod: input.paymentMethod,
        paidAt: status === "PAID" ? new Date() : null,
      },
    });

    return updated;
  } catch (error) {
    console.error("[INSTALLMENT] Error updating payment:", error);
    throw error;
  }
}
