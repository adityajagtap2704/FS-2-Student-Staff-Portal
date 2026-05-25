import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/bonafide/[id]/pdf
// Returns a print-ready HTML page. The browser's print dialog saves it as PDF.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const bonafide = await db.bonafideRequest.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNumber: true,
            classEnrolled: true,
            admissionDate: true,
          },
        },
      },
    });

    if (!bonafide) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isStudent = user.role === "STUDENT" && bonafide.studentId === parseInt(user.id);
    const isStaff   = user.role === "NON_TEACHING_STAFF";

    if (!isStudent && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (bonafide.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Certificate is only available for approved requests" },
        { status: 422 }
      );
    }

    const s = bonafide.student;
    const studentName   = s?.name          ?? "Student";
    const rollNumber    = s?.rollNumber    ?? "N/A";
    const classEnrolled = s?.classEnrolled ?? "N/A";
    const admissionYear = s?.admissionDate
      ? new Date(s.admissionDate).getFullYear()
      : new Date().getFullYear();

    const approvedDate = bonafide.approvedAt
      ? new Date(bonafide.approvedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    const issuedDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const certNo     = `KALNET/BON/${new Date().getFullYear()}/${String(bonafide.id).padStart(4, "0")}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bonafide Certificate – ${studentName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      background: #f0fdf4;
      color: #1e293b;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Print button bar (hidden on print) ── */
    .print-bar {
      max-width: 780px;
      margin: 20px auto 0;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 0 16px;
    }
    .btn {
      padding: 10px 24px;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: all .2s;
    }
    .btn-print  { background: #1D9E75; color: #fff; }
    .btn-print:hover  { background: #167d5d; }
    .btn-close  { background: #f1f5f9; color: #475569; }
    .btn-close:hover  { background: #e2e8f0; }

    /* ── Certificate card ── */
    .page {
      max-width: 780px;
      margin: 20px auto 40px;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(29,158,117,.12);
      border: 2px solid #1D9E75;
      position: relative;
    }

    /* Inner border accent */
    .page::before {
      content: '';
      position: absolute;
      inset: 6px;
      border: 1px solid #a3e8cc;
      border-radius: 11px;
      pointer-events: none;
      z-index: 0;
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #1D9E75 0%, #38bc8e 100%);
      padding: 28px 40px 24px;
      text-align: center;
      position: relative;
      z-index: 1;
    }
    .header-logo {
      width: 52px; height: 52px;
      border-radius: 50%;
      background: rgba(255,255,255,.2);
      border: 2px solid rgba(255,255,255,.4);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px;
      font-size: 18px; font-weight: 800; color: #fff;
    }
    .school-name {
      font-size: 22px; font-weight: 800;
      color: #fff; letter-spacing: 3px;
    }
    .school-tagline {
      font-size: 10px; color: #d0f4e5;
      margin-top: 4px; letter-spacing: 1px;
    }

    /* ── Certificate title ── */
    .cert-title-wrap {
      text-align: center;
      padding: 28px 40px 0;
      position: relative; z-index: 1;
    }
    .cert-title {
      font-size: 20px; font-weight: 800;
      color: #1D9E75; letter-spacing: 2px;
      text-transform: uppercase;
    }
    .cert-underline {
      width: 180px; height: 2px;
      background: linear-gradient(90deg, transparent, #1D9E75, transparent);
      margin: 8px auto 0;
    }
    .cert-no {
      font-size: 10px; color: #9ca3af;
      margin-top: 6px;
    }

    /* ── Body ── */
    .body {
      padding: 24px 40px 0;
      position: relative; z-index: 1;
    }
    .salutation {
      font-size: 13px; color: #444;
      margin-bottom: 16px;
    }
    .para {
      font-size: 13px; color: #444;
      line-height: 1.75;
      text-align: justify;
      margin-bottom: 14px;
    }
    .para strong { color: #1D9E75; }

    /* ── Details table ── */
    .table-wrap {
      padding: 20px 40px 0;
      position: relative; z-index: 1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    thead tr { background: #edfaf4; }
    thead th {
      padding: 10px 14px;
      font-size: 10px; font-weight: 700;
      color: #1D9E75; text-transform: uppercase;
      letter-spacing: .8px; text-align: left;
    }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody tr:nth-child(odd)  { background: #fff; }
    tbody td {
      padding: 10px 14px;
      font-size: 12px;
      border-top: 1px solid #f3f4f6;
    }
    tbody td:first-child { color: #6b7280; font-weight: 600; width: 200px; }
    tbody td:last-child  { color: #1e293b; font-weight: 500; }

    /* ── Signature ── */
    .sig-wrap {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 32px 40px 28px;
      position: relative; z-index: 1;
    }
    .sig-left { }
    .sig-line {
      width: 180px; height: 1px;
      background: #1D9E75;
      margin-bottom: 8px;
    }
    .sig-name  { font-size: 12px; font-weight: 700; color: #444; }
    .sig-title { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .sig-sub   { font-size: 10px; color: #9ca3af; margin-top: 1px; }

    .stamp-box {
      width: 96px; height: 96px;
      border: 1.5px dashed #a3e8cc;
      border-radius: 8px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 2px;
    }
    .stamp-text { font-size: 9px; color: #d1fae5; font-weight: 700; letter-spacing: 1px; }

    /* ── Footer ── */
    .footer {
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 12px 40px;
      text-align: center;
      position: relative; z-index: 1;
    }
    .footer p { font-size: 9.5px; color: #9ca3af; line-height: 1.6; }
    .footer strong { color: #6b7280; }

    /* ── Print styles ── */
    @media print {
      body { background: #fff; }
      .print-bar { display: none !important; }
      .page {
        margin: 0; border-radius: 0;
        box-shadow: none;
        border: 2px solid #1D9E75;
        max-width: 100%;
      }
      @page { size: A4; margin: 10mm; }
    }
  </style>
</head>
<body>

  <!-- Print bar -->
  <div class="print-bar">
    <button class="btn btn-close" onclick="window.close()">✕ Close</button>
    <button class="btn btn-print" onclick="window.print()">🖨️ Save as PDF / Print</button>
  </div>

  <!-- Certificate -->
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div class="header-logo">KN</div>
      <div class="school-name">KALNET SCHOOL</div>
      <div class="school-tagline">Excellence in Education &nbsp;•&nbsp; Est. 2020</div>
    </div>

    <!-- Title -->
    <div class="cert-title-wrap">
      <div class="cert-title">Bonafide Certificate</div>
      <div class="cert-underline"></div>
      <div class="cert-no">Certificate No: ${certNo}</div>
    </div>

    <!-- Body -->
    <div class="body">
      <p class="salutation">To Whomsoever It May Concern,</p>

      <p class="para">
        This is to certify that <strong>${studentName}</strong>
        (Roll No: <strong>${rollNumber}</strong>) is a bonafide student of
        <strong>KALNET School</strong>, currently enrolled in
        <strong>${classEnrolled}</strong> for the academic year
        <strong>${admissionYear}–${admissionYear + 1}</strong>.
      </p>

      <p class="para">
        This certificate is issued for the purpose of:
        <strong>${bonafide.reason}.</strong>
      </p>

      <p class="para">
        This certificate is issued on the request of the student and is valid for official purposes only.
      </p>
    </div>

    <!-- Details table -->
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Student Name</td>    <td>${studentName}</td></tr>
          <tr><td>Roll Number</td>     <td>${rollNumber}</td></tr>
          <tr><td>Class / Section</td> <td>${classEnrolled}</td></tr>
          <tr><td>Date of Approval</td><td>${approvedDate}</td></tr>
          <tr><td>Date of Issue</td>   <td>${issuedDate}</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Signature -->
    <div class="sig-wrap">
      <div class="sig-left">
        <div class="sig-line"></div>
        <div class="sig-name">Authorised Signatory</div>
        <div class="sig-title">KALNET School Administration</div>
        <div class="sig-sub">(Non-Teaching Staff / Office)</div>
      </div>
      <div class="stamp-box">
        <div class="stamp-text">OFFICIAL</div>
        <div class="stamp-text">STAMP</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        This is a computer-generated certificate and is valid without a physical signature.<br/>
        <strong>For verification:</strong> admin@kalnet.edu &nbsp;|&nbsp; © ${new Date().getFullYear()} KALNET School
      </p>
    </div>

  </div>

  <script>
    // Auto-trigger print dialog so user can Save as PDF immediately
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 600);
    });
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("[BONAFIDE PDF ERROR]", error?.message ?? error);
    return NextResponse.json(
      { error: "Failed to generate certificate", detail: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
