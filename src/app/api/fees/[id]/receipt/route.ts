import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { getReceiptByFeeId } from "@/lib/paymentDb";

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  
  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? " " + ones[n%10] : "");
    if (n < 1000) return ones[Math.floor(n/100)] + " Hundred" + (n%100 ? " and " + convert(n%100) : "");
    if (n < 100000) return convert(Math.floor(n/1000)) + " Thousand" + (n%1000 ? " " + convert(n%1000) : "");
    if (n < 10000000) return convert(Math.floor(n/100000)) + " Lakh" + (n%100000 ? " " + convert(n%100000) : "");
    return convert(Math.floor(n/10000000)) + " Crore" + (n%10000000 ? " " + convert(n%10000000) : "");
  }
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = "Rupees " + convert(rupees);
  if (paise > 0) result += " and " + convert(paise) + " Paise";
  return result + " Only";
}

function generateReceiptHTML(data: {
  receiptNumber: string;
  issuedAt: string;
  studentName: string;
  rollNumber: string;
  classEnrolled: string;
  email: string;
  parentName: string;
  term: string;
  feeType: string;
  dueDate: string;
  amountInr: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  feeId: number;
  academicYear: string;
}): string {
  const amountWords = numberToWords(data.amountInr);
  const serialNo = data.receiptNumber.replace(/[^0-9]/g, '') || String(data.feeId);
  
  const feeTypeLabel: Record<string, string> = {
    "Tuition": "Tuition Fee",
    "Transport": "Transport Fee",
    "Activity": "Activity / Extra-Curricular Fee",
    "Outstanding": "Outstanding / Miscellaneous Fee",
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fee Receipt - ${data.receiptNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', 'Segoe UI', sans-serif;
      background: #e8e8e8;
      padding: 20px;
      color: #1a1a2e;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .receipt-page {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      border: 2px solid #1a1a2e;
      position: relative;
      overflow: hidden;
    }

    /* Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 80px;
      font-weight: 700;
      color: rgba(16, 185, 129, 0.06);
      letter-spacing: 12px;
      pointer-events: none;
      white-space: nowrap;
      z-index: 0;
      font-family: 'Playfair Display', serif;
    }

    .receipt-content {
      position: relative;
      z-index: 1;
      padding: 0;
    }

    /* Top decorative band */
    .top-band {
      height: 8px;
      background: linear-gradient(90deg, #1a1a2e, #16213e, #0f3460, #16213e, #1a1a2e);
    }

    /* Header */
    .header {
      text-align: center;
      padding: 28px 40px 20px;
      border-bottom: 2px solid #1a1a2e;
      position: relative;
    }

    .header-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 18px;
      margin-bottom: 6px;
    }

    .logo-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1a1a2e, #0f3460);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: 22px;
      font-family: 'Playfair Display', serif;
      letter-spacing: 1px;
      flex-shrink: 0;
    }

    .header-text h1 {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      color: #1a1a2e;
      letter-spacing: 3px;
      text-transform: uppercase;
    }

    .header-text .tagline {
      font-size: 10px;
      color: #64748b;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-top: 2px;
    }

    .header-address {
      font-size: 11px;
      color: #475569;
      margin-top: 8px;
      line-height: 1.5;
    }

    /* Receipt title band */
    .receipt-title-band {
      background: #1a1a2e;
      color: #fff;
      text-align: center;
      padding: 10px 40px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 5px;
      text-transform: uppercase;
    }

    /* Meta row */
    .meta-row {
      display: flex;
      justify-content: space-between;
      padding: 16px 40px;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .meta-item { }
    .meta-label {
      font-size: 9px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .meta-value {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a2e;
      margin-top: 2px;
    }

    /* Student info section */
    .student-section {
      padding: 24px 40px;
      border-bottom: 1px solid #e2e8f0;
    }

    .section-heading {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 14px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 40px;
    }

    .info-item { }
    .info-label {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      font-size: 13px;
      font-weight: 500;
      color: #1e293b;
      margin-top: 1px;
    }

    /* Fee table */
    .fee-section {
      padding: 24px 40px;
      border-bottom: 1px solid #e2e8f0;
    }

    .fee-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }

    .fee-table thead th {
      background: #f1f5f9;
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 10px 14px;
      text-align: left;
      border: 1px solid #e2e8f0;
    }

    .fee-table thead th:last-child {
      text-align: right;
    }

    .fee-table tbody td {
      font-size: 13px;
      padding: 12px 14px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }

    .fee-table tbody td:last-child {
      text-align: right;
      font-weight: 500;
    }

    .fee-table tfoot td {
      padding: 12px 14px;
      border: 1px solid #e2e8f0;
      font-weight: 700;
      font-size: 14px;
    }

    .fee-table tfoot td:last-child {
      text-align: right;
      color: #1a1a2e;
      font-size: 16px;
    }

    .amount-words {
      padding: 10px 40px;
      font-size: 11px;
      color: #475569;
      font-style: italic;
      border-bottom: 1px solid #e2e8f0;
      background: #fefce8;
    }

    .amount-words strong {
      color: #1e293b;
      font-style: normal;
    }

    /* Payment reference */
    .payment-ref {
      padding: 20px 40px;
      border-bottom: 1px solid #e2e8f0;
    }

    .ref-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 40px;
      margin-top: 12px;
    }

    .ref-item {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      padding: 6px 0;
      border-bottom: 1px dashed #e2e8f0;
    }

    .ref-label { color: #64748b; }
    .ref-value { color: #1e293b; font-weight: 500; font-family: 'Courier New', monospace; font-size: 10px; }

    /* Signature section */
    .signature-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 30px 40px 20px;
    }

    .sig-block {
      text-align: center;
      min-width: 180px;
    }

    .sig-line {
      border-top: 1px solid #1a1a2e;
      padding-top: 6px;
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .paid-stamp {
      width: 100px;
      height: 100px;
      border: 4px solid #10b981;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transform: rotate(-15deg);
      opacity: 0.85;
    }

    .paid-stamp .stamp-text {
      font-size: 24px;
      font-weight: 700;
      color: #10b981;
      letter-spacing: 3px;
    }

    .paid-stamp .stamp-date {
      font-size: 8px;
      color: #10b981;
      margin-top: 2px;
    }

    /* Footer */
    .footer {
      background: #f8fafc;
      padding: 14px 40px;
      border-top: 2px solid #1a1a2e;
    }

    .footer-text {
      font-size: 9px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.6;
    }

    .footer-text strong {
      color: #64748b;
    }

    /* Bottom band */
    .bottom-band {
      height: 8px;
      background: linear-gradient(90deg, #1a1a2e, #16213e, #0f3460, #16213e, #1a1a2e);
    }

    /* Print styles */
    @media print {
      body { background: #fff; padding: 0; }
      .receipt-page { border: none; box-shadow: none; }
      .no-print { display: none !important; }
    }

    /* Print button */
    .print-bar {
      max-width: 800px;
      margin: 0 auto 16px;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }
    .print-bar button {
      padding: 10px 24px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      transition: all 0.2s;
    }
    .btn-print {
      background: #1a1a2e;
      color: #fff;
    }
    .btn-print:hover { background: #0f3460; }
    .btn-download {
      background: #10b981;
      color: #fff;
    }
    .btn-download:hover { background: #059669; }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <button class="btn-print" onclick="window.print()">🖨️ Print Receipt</button>
  </div>

  <div class="receipt-page">
    <div class="watermark">KALNET</div>
    <div class="receipt-content">
      <!-- Top Band -->
      <div class="top-band"></div>

      <!-- Header -->
      <div class="header">
        <div class="header-logo">
          <div class="logo-circle">KN</div>
          <div class="header-text">
            <h1>Kalnet School</h1>
            <div class="tagline">Excellence in Education Since 2020</div>
          </div>
        </div>
        <div class="header-address">
          KALNET Campus, Main Road, Telangana – 500001, India<br>
          Phone: +91 40 2345 6789 &nbsp;|&nbsp; Email: fees@kalnet.edu &nbsp;|&nbsp; GSTIN: 36AABCK1234H1ZA
        </div>
      </div>

      <!-- Title Band -->
      <div class="receipt-title-band">Official Fee Receipt</div>

      <!-- Receipt Meta -->
      <div class="meta-row">
        <div class="meta-item">
          <div class="meta-label">Receipt No.</div>
          <div class="meta-value">${data.receiptNumber}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Date of Issue</div>
          <div class="meta-value">${data.issuedAt}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Academic Year</div>
          <div class="meta-value">${data.academicYear}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Serial No.</div>
          <div class="meta-value">#${serialNo.padStart(6, '0')}</div>
        </div>
      </div>

      <!-- Student Details -->
      <div class="student-section">
        <div class="section-heading">Student Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Student Name</div>
            <div class="info-value">${data.studentName || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Roll Number</div>
            <div class="info-value">${data.rollNumber || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Class / Section</div>
            <div class="info-value">Class ${data.classEnrolled || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Parent / Guardian</div>
            <div class="info-value">${data.parentName || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email Address</div>
            <div class="info-value">${data.email || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Payment Mode</div>
            <div class="info-value">${data.razorpayPaymentId ? 'Online (Razorpay)' : 'Office / Cash'}</div>
          </div>
        </div>
      </div>

      <!-- Fee Breakdown Table -->
      <div class="fee-section">
        <div class="section-heading">Fee Particulars</div>
        <table class="fee-table">
          <thead>
            <tr>
              <th style="width:50px">S.No</th>
              <th>Particulars</th>
              <th>Term / Period</th>
              <th>Due Date</th>
              <th style="width:130px">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>${feeTypeLabel[data.feeType] || data.feeType}</td>
              <td>${data.term}</td>
              <td>${data.dueDate}</td>
              <td>₹${data.amountInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align:right; background:#f8fafc;">Total Amount Paid</td>
              <td style="background:#f0fdf4;">₹${data.amountInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Amount in Words -->
      <div class="amount-words">
        <strong>Amount in Words:</strong> ${amountWords}
      </div>

      <!-- Payment Reference -->
      ${(data.razorpayOrderId || data.razorpayPaymentId) ? `
      <div class="payment-ref">
        <div class="section-heading">Transaction Details</div>
        <div class="ref-grid">
          ${data.razorpayOrderId ? `
          <div class="ref-item">
            <span class="ref-label">Order ID</span>
            <span class="ref-value">${data.razorpayOrderId}</span>
          </div>` : ''}
          ${data.razorpayPaymentId ? `
          <div class="ref-item">
            <span class="ref-label">Payment ID</span>
            <span class="ref-value">${data.razorpayPaymentId}</span>
          </div>` : ''}
          <div class="ref-item">
            <span class="ref-label">Payment Status</span>
            <span class="ref-value" style="color:#10b981; font-family:Inter,sans-serif;">✓ VERIFIED</span>
          </div>
          <div class="ref-item">
            <span class="ref-label">Fee Reference</span>
            <span class="ref-value">FEE-${String(data.feeId).padStart(6, '0')}</span>
          </div>
        </div>
      </div>` : `
      <div class="payment-ref">
        <div class="section-heading">Transaction Details</div>
        <div class="ref-grid">
          <div class="ref-item">
            <span class="ref-label">Fee Reference</span>
            <span class="ref-value">FEE-${String(data.feeId).padStart(6, '0')}</span>
          </div>
          <div class="ref-item">
            <span class="ref-label">Payment Status</span>
            <span class="ref-value" style="color:#10b981; font-family:Inter,sans-serif;">✓ PAID</span>
          </div>
        </div>
      </div>`}

      <!-- Signature Section -->
      <div class="signature-section">
        <div class="sig-block">
          <div style="height:50px"></div>
          <div class="sig-line">Student / Parent Signature</div>
        </div>

        <div class="paid-stamp">
          <div class="stamp-text">PAID</div>
          <div class="stamp-date">${data.issuedAt}</div>
        </div>

        <div class="sig-block">
          <div style="height:50px"></div>
          <div class="sig-line">Authorized Signatory</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-text">
          This is a computer-generated receipt and is valid without a physical signature.<br>
          <strong>Terms:</strong> Fees once paid are non-refundable. For queries, contact the Accounts Department at fees@kalnet.edu<br>
          Receipt generated on ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })} &nbsp;|&nbsp; © ${new Date().getFullYear()} KALNET School
        </div>
      </div>

      <!-- Bottom Band -->
      <div class="bottom-band"></div>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session || !user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const feeId = Number(id);
    if (!feeId || Number.isNaN(feeId)) {
      return NextResponse.json({ error: "Invalid fee id" }, { status: 400 });
    }

    const fee = await db.fee.findUnique({
      where: { id: feeId },
      include: {
        student: { select: { id: true, name: true, email: true, classEnrolled: true, rollNumber: true, parentName: true } },
      },
    });
    if (!fee) return NextResponse.json({ error: "Fee not found" }, { status: 404 });

    if (user.role === "STUDENT" && Number(user.id) !== fee.studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.role === "CLASS_TEACHER" && fee.student?.classEnrolled !== user.assignedClass) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.role !== "STUDENT" && user.role !== "CLASS_TEACHER" && user.role !== "HOD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const receipt = await getReceiptByFeeId(feeId);
    
    // If no receipt found but fee is paid, generate one anyway
    if (!receipt && fee.status !== "PAID") {
      return NextResponse.json({ error: "Receipt not available (fee not paid)" }, { status: 409 });
    }

    const amountInr = receipt ? (receipt.amountPaise ?? 0) / 100 : Number(fee.paidAmount);
    const issuedAt = receipt?.issuedAt ? new Date(receipt.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // Academic year calculation
    const now = new Date();
    const acadStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const academicYear = `${acadStartYear}–${acadStartYear + 1}`;

    const html = generateReceiptHTML({
      receiptNumber: receipt?.receiptNumber ?? `KN-RCP-${String(feeId).padStart(5, '0')}`,
      issuedAt,
      studentName: fee.student?.name || '',
      rollNumber: fee.student?.rollNumber || '',
      classEnrolled: fee.student?.classEnrolled || '',
      email: fee.student?.email || '',
      parentName: fee.student?.parentName || '',
      term: fee.term,
      feeType: fee.type,
      dueDate: new Date(fee.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      amountInr,
      razorpayOrderId: receipt?.razorpayOrderId || undefined,
      razorpayPaymentId: receipt?.razorpayPaymentId || undefined,
      feeId,
      academicYear,
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="receipt-${feeId}.html"`,
      },
    });
  } catch (error) {
    console.error("Receipt Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
