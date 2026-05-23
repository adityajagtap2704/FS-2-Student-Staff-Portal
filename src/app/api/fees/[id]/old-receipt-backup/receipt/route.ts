import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { feeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    
    if (!session || user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feeId = Number(params.feeId);
    if (!feeId || Number.isNaN(feeId)) {
      return NextResponse.json({ error: "Invalid fee ID" }, { status: 400 });
    }

    // Verify fee belongs to student
    const fee = await db.fee.findFirst({
      where: { id: feeId, studentId: Number(user.id) },
      include: { student: true },
    });

    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    if (fee.status !== "PAID") {
      return NextResponse.json({ error: "Fee is not paid" }, { status: 400 });
    }

    // Get payment transaction details
    const paymentTransaction = await db.$queryRaw`
      SELECT 
        po.razorpay_order_id,
        pt.razorpay_payment_id,
        fr.receipt_number,
        fr.issued_at,
        po.amount_paise,
        po.currency,
        po.created_at
      FROM payment_orders po
      LEFT JOIN payment_transactions pt ON pt.razorpay_order_id = po.razorpay_order_id
      LEFT JOIN fee_receipts fr ON fr.razorpay_order_id = po.razorpay_order_id
      WHERE po.fee_id = ${feeId}
      ORDER BY po.created_at DESC
      LIMIT 1
    ` as any[];

    if (!paymentTransaction || paymentTransaction.length === 0) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    const payment = paymentTransaction[0];
    const receiptNumber = payment.receipt_number || `RCP-${payment.razorpay_order_id}`;
    const issuedAt = payment.issued_at || new Date();
    const amountInRupees = (payment.amount_paise || 0) / 100;

    // Generate HTML receipt
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt - ${receiptNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #16a34a;
            padding-bottom: 20px;
          }
          
          .header h1 {
            color: #16a34a;
            font-size: 28px;
            margin-bottom: 5px;
          }
          
          .header p {
            color: #666;
            font-size: 14px;
          }
          
          .status-badge {
            display: inline-block;
            background: #dcfce7;
            color: #166534;
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 10px;
            font-size: 14px;
          }
          
          .section {
            margin-bottom: 30px;
          }
          
          .section-title {
            font-weight: bold;
            color: #333;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 15px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 14px;
          }
          
          .label {
            color: #666;
            font-weight: 500;
          }
          
          .value {
            color: #333;
            font-weight: 600;
          }
          
          .amount-section {
            background: #f9fafb;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 20px;
          }
          
          .amount-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          
          .amount-row.total {
            border-top: 2px solid #e5e7eb;
            padding-top: 10px;
            font-size: 16px;
            font-weight: bold;
            color: #16a34a;
          }
          
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #999;
            font-size: 12px;
          }
          
          .footer p {
            margin-bottom: 8px;
          }
          
          .receipt-number {
            font-family: 'Courier New', monospace;
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
          }
          
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .container {
              box-shadow: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KALNET</h1>
            <p>Payment Receipt</p>
            <div class="status-badge">✓ Payment Successful</div>
          </div>

          <div class="section">
            <div class="section-title">Receipt Details</div>
            <div class="row">
              <span class="label">Receipt Number:</span>
              <span class="value"><span class="receipt-number">${receiptNumber}</span></span>
            </div>
            <div class="row">
              <span class="label">Issued Date:</span>
              <span class="value">${new Date(issuedAt).toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div class="row">
              <span class="label">Receipt Time:</span>
              <span class="value">${new Date(issuedAt).toLocaleTimeString('en-IN')}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Student Information</div>
            <div class="row">
              <span class="label">Name:</span>
              <span class="value">${fee.student.name || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="label">Email:</span>
              <span class="value">${fee.student.email}</span>
            </div>
            <div class="row">
              <span class="label">Student ID:</span>
              <span class="value">${fee.student.id}</span>
            </div>
            <div class="row">
              <span class="label">Class:</span>
              <span class="value">${fee.student.classEnrolled || 'N/A'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Fee Information</div>
            <div class="row">
              <span class="label">Fee ID:</span>
              <span class="value">${fee.id}</span>
            </div>
            <div class="row">
              <span class="label">Term:</span>
              <span class="value">${fee.term}</span>
            </div>
            <div class="row">
              <span class="label">Fee Type:</span>
              <span class="value">${fee.type}</span>
            </div>
            <div class="row">
              <span class="label">Due Date:</span>
              <span class="value">${new Date(fee.dueDate).toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Payment Summary</div>
            <div class="amount-section">
              <div class="amount-row">
                <span class="label">Fee Amount:</span>
                <span class="value">₹${Number(fee.amount).toLocaleString('en-IN', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}</span>
              </div>
              ${Number(fee.penaltyAmount) > 0 ? `
              <div class="amount-row">
                <span class="label">Penalty (${fee.penaltyPercentage}%):</span>
                <span class="value" style="color: #dc2626;">₹${Number(fee.penaltyAmount).toLocaleString('en-IN', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}</span>
              </div>
              ` : ''}
              <div class="amount-row total">
                <span>Total Amount Paid:</span>
                <span>₹${(Number(fee.amount) + Number(fee.penaltyAmount || 0)).toLocaleString('en-IN', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Transaction Details</div>
            <div class="row">
              <span class="label">Payment Method:</span>
              <span class="value">Online (Razorpay)</span>
            </div>
            <div class="row">
              <span class="label">Order ID:</span>
              <span class="value"><span class="receipt-number">${payment.razorpay_order_id}</span></span>
            </div>
            <div class="row">
              <span class="label">Payment ID:</span>
              <span class="value"><span class="receipt-number">${payment.razorpay_payment_id || 'N/A'}</span></span>
            </div>
            <div class="row">
              <span class="label">Currency:</span>
              <span class="value">${payment.currency || 'INR'}</span>
            </div>
            <div class="row">
              <span class="label">Status:</span>
              <span class="value" style="color: #16a34a; font-weight: bold;">PAID</span>
            </div>
          </div>

          <div class="footer">
            <p>This is an electronically generated receipt. No signature is required.</p>
            <p>For payment queries, please contact: <strong>fees@kalnet.edu</strong></p>
            <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
            <p style="margin-top: 15px; color: #ccc;">Receipt ID: ${receiptNumber}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="receipt-${receiptNumber}.html"`,
      },
    });
  } catch (error) {
    console.error("Receipt generation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
