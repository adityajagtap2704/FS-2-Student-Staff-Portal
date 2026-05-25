import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { getReceiptByFeeId } from "@/lib/paymentDb";

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  }
  const rupees = Math.floor(num);
  const paise  = Math.round((num - rupees) * 100);
  let result   = "Rupees " + convert(rupees);
  if (paise > 0) result += " and " + convert(paise) + " Paise";
  return result + " Only";
}

const feeTypeLabel: Record<string, string> = {
  Tuition:     "Tuition Fee",
  Transport:   "Transport Fee",
  Activity:    "Activity / Extra-Curricular Fee",
  Outstanding: "Outstanding / Miscellaneous Fee",
};

function fmt(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function inr(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter','Segoe UI',sans-serif;background:#e8e8e8;padding:20px;color:#1a1a2e;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .print-bar{max-width:820px;margin:0 auto 16px;display:flex;gap:10px;justify-content:flex-end;}
  .print-bar button{padding:10px 24px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;}
  .btn-print{background:#1a1a2e;color:#fff;} .btn-close{background:#f1f5f9;color:#475569;}
  .receipt-page{max-width:820px;margin:0 auto;background:#fff;border:2px solid #1a1a2e;position:relative;overflow:hidden;}
  .watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:80px;font-weight:700;color:rgba(16,185,129,0.05);letter-spacing:12px;pointer-events:none;white-space:nowrap;z-index:0;font-family:'Playfair Display',serif;}
  .rc{position:relative;z-index:1;}
  .top-band,.bottom-band{height:8px;background:linear-gradient(90deg,#1a1a2e,#16213e,#0f3460,#16213e,#1a1a2e);}
  .header{text-align:center;padding:28px 40px 20px;border-bottom:2px solid #1a1a2e;}
  .header-logo{display:flex;align-items:center;justify-content:center;gap:18px;margin-bottom:6px;}
  .logo-circle{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#1a1a2e,#0f3460);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:22px;font-family:'Playfair Display',serif;}
  .header-text h1{font-family:'Playfair Display',serif;font-size:28px;color:#1a1a2e;letter-spacing:3px;text-transform:uppercase;}
  .header-text .tagline{font-size:10px;color:#64748b;letter-spacing:4px;text-transform:uppercase;margin-top:2px;}
  .header-address{font-size:11px;color:#475569;margin-top:8px;line-height:1.5;}
  .title-band{background:#1a1a2e;color:#fff;text-align:center;padding:10px 40px;font-size:14px;font-weight:600;letter-spacing:5px;text-transform:uppercase;}
  .meta-row{display:flex;justify-content:space-between;padding:16px 40px;border-bottom:1px solid #e2e8f0;background:#f8fafc;}
  .meta-label{font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;}
  .meta-value{font-size:13px;font-weight:600;color:#1a1a2e;margin-top:2px;}
  .section{padding:22px 40px;border-bottom:1px solid #e2e8f0;}
  .section-heading{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 40px;}
  .info-label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;}
  .info-value{font-size:13px;font-weight:500;color:#1e293b;margin-top:1px;}
  .fee-table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px;}
  .fee-table thead th{background:#f1f5f9;font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.8px;padding:10px 14px;text-align:left;border:1px solid #e2e8f0;}
  .fee-table tbody td{padding:11px 14px;border:1px solid #e2e8f0;color:#334155;}
  .fee-table tfoot td{padding:12px 14px;border:1px solid #e2e8f0;font-weight:700;font-size:14px;}
  .total-label{text-align:right;background:#f8fafc;color:#1a1a2e;}
  .total-value{text-align:right;background:#f0fdf4;color:#059669;font-size:16px;}
  .amount-words{padding:10px 40px;font-size:11px;color:#475569;font-style:italic;border-bottom:1px solid #e2e8f0;background:#fefce8;}
  .ref-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 40px;margin-top:12px;}
  .ref-item{display:flex;justify-content:space-between;font-size:11px;padding:6px 0;border-bottom:1px dashed #e2e8f0;}
  .ref-label{color:#64748b;} .ref-value{color:#1e293b;font-weight:500;font-family:'Courier New',monospace;font-size:10px;}
  .sig-section{display:flex;justify-content:space-between;align-items:flex-end;padding:30px 40px 20px;}
  .sig-block{text-align:center;min-width:180px;}
  .sig-line{border-top:1px solid #1a1a2e;padding-top:6px;font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;}
  .paid-stamp{width:100px;height:100px;border:4px solid #10b981;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-15deg);opacity:.85;}
  .stamp-text{font-size:24px;font-weight:700;color:#10b981;letter-spacing:3px;}
  .stamp-date{font-size:8px;color:#10b981;margin-top:2px;}
  .footer{background:#f8fafc;padding:14px 40px;border-top:2px solid #1a1a2e;}
  .footer-text{font-size:9px;color:#94a3b8;text-align:center;line-height:1.6;}
  @media print{body{background:#fff;padding:0;}.receipt-page{border:none;}.print-bar{display:none!important;}@page{size:A4;margin:10mm;}}
`;

// ── HTML builder ──────────────────────────────────────────────────────────────

function buildReceiptHTML(opts: {
  receiptNumber: string;
  serialNo: string;
  paidAt: string;
  academicYear: string;
  studentName: string;
  rollNumber: string;
  classEnrolled: string;
  email: string;
  parentName: string;
  paymentMode: string;
  feeId: number;
  sectionHeading: string;
  tableHeadHtml: string;
  tableBodyHtml: string;
  totalLabel: string;
  totalAmount: number;
  amountWords: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  extraRefRows?: string;
  generatedAt: string;
  year: number;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Fee Receipt – ${opts.receiptNumber}</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="print-bar">
    <button class="btn-close" onclick="window.close()">✕ Close</button>
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <div class="receipt-page">
    <div class="watermark">KALNET</div>
    <div class="rc">
      <div class="top-band"></div>

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
          Phone: +91 40 2345 6789 &nbsp;|&nbsp; Email: fees@kalnet.edu
        </div>
      </div>

      <div class="title-band">Official Fee Receipt</div>

      <div class="meta-row">
        <div><div class="meta-label">Receipt No.</div><div class="meta-value">${opts.receiptNumber}</div></div>
        <div><div class="meta-label">Payment Date</div><div class="meta-value">${opts.paidAt}</div></div>
        <div><div class="meta-label">Academic Year</div><div class="meta-value">${opts.academicYear}</div></div>
        <div><div class="meta-label">Serial No.</div><div class="meta-value">#${opts.serialNo.padStart(6, "0")}</div></div>
      </div>

      <div class="section">
        <div class="section-heading">Student Information</div>
        <div class="info-grid">
          <div><div class="info-label">Student Name</div><div class="info-value">${opts.studentName || "N/A"}</div></div>
          <div><div class="info-label">Roll Number</div><div class="info-value">${opts.rollNumber || "N/A"}</div></div>
          <div><div class="info-label">Class / Section</div><div class="info-value">${opts.classEnrolled || "N/A"}</div></div>
          <div><div class="info-label">Parent / Guardian</div><div class="info-value">${opts.parentName || "N/A"}</div></div>
          <div><div class="info-label">Email Address</div><div class="info-value">${opts.email || "N/A"}</div></div>
          <div><div class="info-label">Payment Mode</div><div class="info-value">${opts.paymentMode}</div></div>
        </div>
      </div>

      <div class="section">
        <div class="section-heading">${opts.sectionHeading}</div>
        <table class="fee-table">
          <thead>${opts.tableHeadHtml}</thead>
          <tbody>${opts.tableBodyHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="total-label">${opts.totalLabel}</td>
              <td class="total-value">${inr(opts.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="amount-words">
        <strong>Amount in Words:</strong> ${opts.amountWords}
      </div>

      <div class="section">
        <div class="section-heading">Transaction Details</div>
        <div class="ref-grid">
          ${opts.razorpayOrderId ? `<div class="ref-item"><span class="ref-label">Order ID</span><span class="ref-value">${opts.razorpayOrderId}</span></div>` : ""}
          ${opts.razorpayPaymentId ? `<div class="ref-item"><span class="ref-label">Payment ID</span><span class="ref-value">${opts.razorpayPaymentId}</span></div>` : ""}
          <div class="ref-item"><span class="ref-label">Payment Status</span><span class="ref-value" style="color:#10b981;font-family:Inter,sans-serif;">✓ VERIFIED</span></div>
          <div class="ref-item"><span class="ref-label">Fee Reference</span><span class="ref-value">FEE-${String(opts.feeId).padStart(6, "0")}</span></div>
          ${opts.extraRefRows ?? ""}
        </div>
      </div>

      <div class="sig-section">
        <div class="sig-block"><div style="height:50px"></div><div class="sig-line">Student / Parent Signature</div></div>
        <div class="paid-stamp"><div class="stamp-text">PAID</div><div class="stamp-date">${opts.paidAt}</div></div>
        <div class="sig-block"><div style="height:50px"></div><div class="sig-line">Authorized Signatory</div></div>
      </div>

      <div class="footer">
        <div class="footer-text">
          This is a computer-generated receipt and is valid without a physical signature.<br>
          <strong>Terms:</strong> Fees once paid are non-refundable. For queries contact fees@kalnet.edu<br>
          Generated on ${opts.generatedAt} &nbsp;|&nbsp; © ${opts.year} KALNET School
        </div>
      </div>
      <div class="bottom-band"></div>
    </div>
  </div>
  <script>window.addEventListener('load',function(){setTimeout(function(){window.print();},500);});</script>
</body>
</html>`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const user    = session?.user as any;
    if (!session || !user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const feeId  = Number(id);
    if (!feeId || Number.isNaN(feeId)) {
      return NextResponse.json({ error: "Invalid fee id" }, { status: 400 });
    }

    // Read optional installmentId from query string
    const url           = new URL(req.url);
    const installmentId = url.searchParams.get("installmentId")
      ? Number(url.searchParams.get("installmentId"))
      : null;

    // Fetch the fee with student info AND its installments
    const fee = await db.fee.findUnique({
      where: { id: feeId },
      include: {
        student: {
          select: {
            id: true, name: true, email: true,
            classEnrolled: true, rollNumber: true, parentName: true,
          },
        },
        installments: {
          orderBy: { installmentNumber: "asc" },
        },
      },
    });

    if (!fee) return NextResponse.json({ error: "Fee not found" }, { status: 404 });

    // Access control
    if (user.role === "STUDENT" && Number(user.id) !== fee.studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.role === "CLASS_TEACHER" && fee.student?.classEnrolled !== user.assignedClass) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!["STUDENT", "CLASS_TEACHER", "HOD", "NON_TEACHING_STAFF"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (fee.status !== "PAID") {
      return NextResponse.json({ error: "Receipt not available — fee not yet paid" }, { status: 409 });
    }

    // Razorpay receipt info for this specific fee
    const receipt = await getReceiptByFeeId(feeId);

    // Dates
    const paidAtDate = fee.paidAt
      ? fmt(fee.paidAt)
      : receipt?.issuedAt
        ? fmt(receipt.issuedAt)
        : fmt(new Date());

    const now           = new Date();
    const acadStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const academicYear  = `${acadStartYear}–${acadStartYear + 1}`;

    const receiptNumber = receipt?.receiptNumber ?? `KN-RCP-${String(feeId).padStart(5, "0")}`;
    const serialNo      = receiptNumber.replace(/[^0-9]/g, "") || String(feeId);
    const paymentMode   = receipt?.razorpayPaymentId ? "Online (Razorpay)" : "Office / Cash";

    const feeLabel      = feeTypeLabel[fee.type] || fee.type;
    const feeAmount     = Number(fee.amount);
    const paidAmount    = Number(fee.paidAmount);

    // ── Decide: installment receipt OR simple receipt ─────────────────────────
    const hasInstallments = fee.installments && fee.installments.length > 0;

    let html: string;

    if (hasInstallments) {
      // ── INSTALLMENT RECEIPT ──────────────────────────────────────────────
      // If a specific installmentId was passed, only show installments up to
      // and including that one (so Installment 1 receipt shows only inst 1,
      // Installment 2 receipt shows inst 1 + inst 2, etc.)

      let visibleInstallments = fee.installments;

      if (installmentId) {
        // Find which installment number this ID corresponds to
        const clickedInst = fee.installments.find(i => i.id === installmentId);
        if (clickedInst) {
          // Show only installments up to and including the clicked one
          visibleInstallments = fee.installments.filter(
            i => i.installmentNumber <= clickedInst.installmentNumber
          );
        }
      }

      const instRows = visibleInstallments
        .map((inst) => {
          const isPaid   = inst.status === "PAID" || Number(inst.paidAmount) > 0;
          const amount   = Number(inst.amount);
          const paid     = Number(inst.paidAmount);
          const statusBg = isPaid ? "background:#f0fdf4;" : "background:#fff;";
          const amtCell  = isPaid
            ? `<span style="color:#059669;font-weight:700;">${inr(paid > 0 ? paid : amount)}</span>`
            : `<span style="color:#94a3b8;">Pending — ${inr(amount)}</span>`;
          const paidOnCell = isPaid && inst.paidAt
            ? fmt(inst.paidAt)
            : isPaid ? paidAtDate : "—";
          const statusBadge = isPaid
            ? `<span style="background:#10b981;color:#fff;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;">PAID</span>`
            : `<span style="background:#f1f5f9;color:#64748b;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:600;">PENDING</span>`;

          return `<tr style="${statusBg}">
            <td style="padding:11px 14px;border:1px solid #e2e8f0;color:#475569;font-weight:600;">
              Installment ${inst.installmentNumber}
            </td>
            <td style="padding:11px 14px;border:1px solid #e2e8f0;">${feeLabel} — ${fee.term}</td>
            <td style="padding:11px 14px;border:1px solid #e2e8f0;color:#475569;">${fmt(inst.dueDate)}</td>
            <td style="padding:11px 14px;border:1px solid #e2e8f0;color:#475569;">${paidOnCell}</td>
            <td style="padding:11px 14px;border:1px solid #e2e8f0;text-align:right;">${amtCell}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td colspan="4" style="padding:4px 14px 8px;border:1px solid #e2e8f0;font-size:10px;color:#94a3b8;">Status</td>
            <td style="padding:4px 14px 8px;border:1px solid #e2e8f0;text-align:right;">${statusBadge}</td>
          </tr>`;
        })
        .join("");

      const totalInstPaid = visibleInstallments.reduce(
        (sum, i) => sum + (Number(i.paidAmount) > 0 ? Number(i.paidAmount) : 0),
        0
      );
      const displayTotal = totalInstPaid > 0 ? totalInstPaid : paidAmount;

      // Label: "Installment 1" or "Installments 1–2" etc.
      const instLabel = visibleInstallments.length === 1
        ? `Installment ${visibleInstallments[0].installmentNumber}`
        : `Installments 1–${visibleInstallments[visibleInstallments.length - 1].installmentNumber}`;

      html = buildReceiptHTML({
        receiptNumber,
        serialNo,
        paidAt: paidAtDate,
        academicYear,
        studentName:  fee.student?.name      ?? "",
        rollNumber:   fee.student?.rollNumber ?? "",
        classEnrolled:fee.student?.classEnrolled ?? "",
        email:        fee.student?.email     ?? "",
        parentName:   fee.student?.parentName ?? "",
        paymentMode,
        feeId,
        sectionHeading: `Fee Particulars — ${fee.term} (${instLabel})`,
        tableHeadHtml: `<tr>
          <th style="width:140px">Installment</th>
          <th>Particulars</th>
          <th style="width:110px">Due Date</th>
          <th style="width:110px">Paid On</th>
          <th style="width:130px;text-align:right">Amount (₹)</th>
        </tr>`,
        tableBodyHtml: instRows,
        totalLabel:   `Total Paid — ${fee.term} (${instLabel})`,
        totalAmount:  displayTotal,
        amountWords:  numberToWords(displayTotal),
        razorpayOrderId:   receipt?.razorpayOrderId   ?? undefined,
        razorpayPaymentId: receipt?.razorpayPaymentId ?? undefined,
        extraRefRows: `
          <div class="ref-item"><span class="ref-label">Fee Term</span><span class="ref-value" style="font-family:Inter,sans-serif;">${fee.term}</span></div>
          <div class="ref-item"><span class="ref-label">Total Fee Amount</span><span class="ref-value" style="font-family:Inter,sans-serif;">${inr(feeAmount)}</span></div>
          <div class="ref-item"><span class="ref-label">This Receipt Covers</span><span class="ref-value" style="font-family:Inter,sans-serif;">${instLabel}</span></div>`,
        generatedAt: now.toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" }),
        year: now.getFullYear(),
      });

    } else {
      // ── SIMPLE (FULL PAYMENT) RECEIPT ────────────────────────────────────
      // Show only this single fee row
      const tableBodyHtml = `<tr style="background:#f0fdf4;">
        <td style="padding:11px 14px;border:1px solid #e2e8f0;color:#475569;">1</td>
        <td style="padding:11px 14px;border:1px solid #e2e8f0;font-weight:600;color:#1e293b;">${feeLabel}</td>
        <td style="padding:11px 14px;border:1px solid #e2e8f0;color:#475569;">${fee.term}</td>
        <td style="padding:11px 14px;border:1px solid #e2e8f0;color:#475569;">${fmt(fee.dueDate)}</td>
        <td style="padding:11px 14px;border:1px solid #e2e8f0;text-align:right;font-weight:700;color:#059669;">${inr(paidAmount)}</td>
      </tr>`;

      html = buildReceiptHTML({
        receiptNumber,
        serialNo,
        paidAt: paidAtDate,
        academicYear,
        studentName:  fee.student?.name      ?? "",
        rollNumber:   fee.student?.rollNumber ?? "",
        classEnrolled:fee.student?.classEnrolled ?? "",
        email:        fee.student?.email     ?? "",
        parentName:   fee.student?.parentName ?? "",
        paymentMode,
        feeId,
        sectionHeading: "Fee Particulars",
        tableHeadHtml: `<tr>
          <th style="width:44px">S.No</th>
          <th>Particulars</th>
          <th>Term / Period</th>
          <th>Due Date</th>
          <th style="width:130px;text-align:right">Amount (₹)</th>
        </tr>`,
        tableBodyHtml,
        totalLabel:   "Total Amount Paid",
        totalAmount:  paidAmount,
        amountWords:  numberToWords(paidAmount),
        razorpayOrderId:   receipt?.razorpayOrderId   ?? undefined,
        razorpayPaymentId: receipt?.razorpayPaymentId ?? undefined,
        extraRefRows: `
          <div class="ref-item"><span class="ref-label">Fee Term</span><span class="ref-value" style="font-family:Inter,sans-serif;">${fee.term}</span></div>
          <div class="ref-item"><span class="ref-label">Fee Type</span><span class="ref-value" style="font-family:Inter,sans-serif;">${feeLabel}</span></div>`,
        generatedAt: now.toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" }),
        year: now.getFullYear(),
      });
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="receipt-${feeId}.html"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Receipt Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
