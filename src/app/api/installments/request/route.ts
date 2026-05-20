import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { createInstallmentRequest } from "@/lib/installmentDb";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/installments/request
 * Student requests installment plan for a fee
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { feeId, numberOfInstallments, reason, firstInstallmentAmount, remainingBalance } = body;

    if (!feeId || !numberOfInstallments || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (numberOfInstallments !== 1) {
      return NextResponse.json(
        { error: "Only 1 installment per term is allowed" },
        { status: 400 }
      );
    }

    // Get the fee to check its term
    const fee = await db.fee.findUnique({
      where: { id: feeId },
    });

    if (!fee) {
      return NextResponse.json(
        { error: "Fee not found" },
        { status: 404 }
      );
    }

    const firstInstallmentValue = Number(firstInstallmentAmount ?? 0) || Math.round(Number(fee.amount) / 2);
    const remainingBalanceValue = Number(remainingBalance ?? 0) || Number(fee.amount) - firstInstallmentValue;

    if (firstInstallmentValue <= 0 || remainingBalanceValue < 0) {
      return NextResponse.json(
        { error: "Invalid installment amount values" },
        { status: 400 }
      );
    }

    // Check if student already has an approved installment request for this term
    const existingInstallmentForTerm = await db.installmentRequest.findFirst({
      where: {
        studentId: Number(user.id),
        status: "APPROVED",
        fee: {
          term: fee.term,
        },
      },
    });

    if (existingInstallmentForTerm) {
      return NextResponse.json(
        { error: `You already have an approved installment plan for ${fee.term}. Only one installment plan is allowed per term.` },
        { status: 400 }
      );
    }

    // Get student details for email
    const student = await db.student.findUnique({
      where: { id: Number(user.id) },
    });

    const request = await createInstallmentRequest({
      feeId,
      studentId: Number(user.id),
      numberOfInstallments: 1,
      reason,
    });

    // Send confirmation email to student
    if (student && student.email) {
      try {
        const emailTemplate = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Installment Request Received</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Dear ${student.name},</p>
              
              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                Your installment request has been successfully submitted and is now under review by the administration.
              </p>
              
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">Request Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Term:</td>
                    <td style="padding: 10px 0; color: #1f2937; text-align: right;">${fee.term}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Total Fee:</td>
                    <td style="padding: 10px 0; color: #1f2937; text-align: right;">₹${Number(fee.amount).toLocaleString()}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">1st Installment:</td>
                    <td style="padding: 10px 0; color: #10b981; text-align: right; font-weight: bold;">₹${firstInstallmentValue.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Remaining Balance:</td>
                    <td style="padding: 10px 0; color: #f59e0b; text-align: right; font-weight: bold;">₹${remainingBalanceValue.toLocaleString()}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Status:</strong> Your request is pending review. You will receive an email notification once the administration has reviewed your request.
                </p>
              </div>
              
              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                If you have any questions, please contact the administration at <a href="mailto:fees@kalnet.edu" style="color: #10b981; text-decoration: none;">fees@kalnet.edu</a>
              </p>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </div>
        `;

        await sendEmail({
          to: student.email,
          subject: "✅ Installment Request Received - KALNET School",
          html: emailTemplate,
        });

        console.log("[INSTALLMENT EMAIL] Confirmation email sent to:", student.email);
      } catch (emailError) {
        console.error("[INSTALLMENT EMAIL] Error sending confirmation email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Installment request submitted successfully",
      request,
    });
  } catch (error: any) {
    console.error("[INSTALLMENT API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/installments/request
 * Student gets their own installment requests
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "50");

    // Student gets their own requests
    const requests = await db.installmentRequest.findMany({
      where: { studentId: Number(user.id) },
      include: {
        fee: true,
      },
      orderBy: { requestedAt: "desc" },
      take: limit,
    });

    // For each request, fetch its installments separately
    const requestsWithInstallments = await Promise.all(
      requests.map(async (req) => {
        const installments = await db.installment.findMany({
          where: { feeId: req.feeId },
          orderBy: { installmentNumber: "asc" },
        });
        return {
          ...req,
          installments,
        };
      })
    );

    return NextResponse.json({
      success: true,
      requests: requestsWithInstallments,
      count: requestsWithInstallments.length,
    });
  } catch (error: any) {
    console.error("[INSTALLMENT API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
