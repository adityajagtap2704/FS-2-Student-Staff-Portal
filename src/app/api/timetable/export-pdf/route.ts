import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TYPE_COLOR: Record<string, string> = {
  EVENT: "#3b82f6", EXAM: "#ef4444", HOLIDAY: "#10b981", TIMETABLE_CHANGE: "#f59e0b",
};
const TYPE_BG: Record<string, string> = {
  EVENT: "#eff6ff", EXAM: "#fef2f2", HOLIDAY: "#f0fdf4", TIMETABLE_CHANGE: "#fffbeb",
};

// ─── Shared CSS ───────────────────────────────────────────────────────────────
const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter','Segoe UI',sans-serif;background:#f0fdf4;color:#1e293b;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .page{max-width:1120px;margin:0 auto;background:#fff;border-radius:0;box-shadow:0 4px 24px rgba(16,185,129,.08);}
  .accent-band{height:5px;background:linear-gradient(90deg,#059669,#10b981,#34d399,#10b981,#059669);}
  .header{background:linear-gradient(135deg,#064e3b 0%,#065f46 50%,#047857 100%);padding:20px 32px;display:flex;align-items:center;justify-content:space-between;}
  .header-left{display:flex;align-items:center;gap:14px;}
  .logo{width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:17px;flex-shrink:0;}
  .school-name{color:#fff;font-size:20px;font-weight:800;letter-spacing:2px;}
  .doc-title{color:#6ee7b7;font-size:11px;font-weight:600;letter-spacing:1.5px;margin-top:3px;}
  .doc-sub{color:#a7f3d0;font-size:10px;margin-top:2px;}
  .header-right{text-align:right;}
  .gen-date{color:#a7f3d0;font-size:10px;}
  .acad-year{color:#6ee7b7;font-size:9px;margin-top:3px;font-weight:600;}
  .print-bar{max-width:1120px;margin:0 auto 12px;display:flex;gap:8px;justify-content:flex-end;padding:14px 0 0;}
  .btn{padding:9px 22px;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s;}
  .btn-print{background:#065f46;color:#fff;}
  .btn-print:hover{background:#047857;}
  .footer{background:linear-gradient(135deg,#064e3b,#065f46);padding:12px 32px;display:flex;justify-content:space-between;align-items:center;margin-top:0;}
  .footer-text{font-size:9px;color:#6ee7b7;}
  .footer-copy{font-size:9px;color:#34d399;font-weight:600;}
  @media print{body{background:#fff;}.print-bar{display:none!important;}.page{box-shadow:none;max-width:100%;}@page{size:A4 landscape;margin:8mm;}}
`;

// ─── WEEKLY HTML ──────────────────────────────────────────────────────────────
function generateWeeklyHTML(data: {
  titleLabel: string; subLabel: string; role: string;
  entries: any[]; slots: any[]; staffMap: Record<number, string>;
}): string {
  const { titleLabel, subLabel, role, entries, slots, staffMap } = data;
  const now = new Date();
  const todayDay = now.getDay() === 0 ? 7 : now.getDay();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const getEntry = (day: number, slotId: number) =>
    entries.find((e: any) => e.dayOfWeek === day && e.slotId === slotId);

  const rows = slots.map((slot: any) => {
    if (slot.isBreak) {
      return `<tr class="break-row">
        <td class="time-cell" style="background:#f0fdf4;color:#059669;font-size:9px;font-weight:700;text-align:center;padding:5px 2px;">${slot.breakLabel || "Break"}</td>
        ${DAYS.map(() => `<td style="background:#f0fdf4;border-right:1px solid #d1fae5;"></td>`).join("")}
      </tr>`;
    }
    const cells = DAYS.map((_, i) => {
      const dayNum = i + 1;
      const entry = getEntry(dayNum, slot.id);
      const isToday = dayNum === todayDay;
      const bg = isToday ? "#f0fdf4" : "#fff";
      if (entry?.subject) {
        const c = entry.subject.color || "#10b981";
        const teacher = entry.staffId && staffMap[entry.staffId] ? staffMap[entry.staffId] : "";
        const room = entry.classroom ? entry.classroom.name : "";
        const cls = role === "CLASS_TEACHER" && entry.classEnrolled ? entry.classEnrolled : "";
        return `<td style="background:${bg};border-right:1px solid #f0fdf4;border-bottom:1px solid #f0fdf4;padding:3px;vertical-align:top;">
          <div style="border-left:3px solid ${c};background:${c}14;border-radius:4px;padding:4px 5px;min-height:46px;">
            <div style="font-size:9px;font-weight:700;color:${c};line-height:1.2;">${entry.subject.name}</div>
            ${teacher ? `<div style="font-size:8px;color:#64748b;margin-top:2px;">${teacher}</div>` : ""}
            ${room ? `<div style="font-size:7px;color:#94a3b8;margin-top:1px;">📍 ${room}</div>` : ""}
            ${cls ? `<div style="font-size:8px;font-weight:600;color:${c};margin-top:2px;">${cls}</div>` : ""}
          </div>
        </td>`;
      }
      return `<td style="background:${bg};border-right:1px solid #f0fdf4;border-bottom:1px solid #f0fdf4;text-align:center;vertical-align:middle;color:#d1fae5;font-size:14px;">—</td>`;
    }).join("");

    return `<tr>
      <td style="width:62px;text-align:center;padding:4px 2px;border-right:1px solid #d1fae5;border-bottom:1px solid #f0fdf4;background:#fafffe;vertical-align:middle;">
        <div style="font-size:10px;font-weight:800;color:#10b981;">P${slot.slotNumber}</div>
        <div style="font-size:8px;color:#64748b;margin-top:1px;">${slot.startTime}</div>
        <div style="font-size:7px;color:#94a3b8;">–${slot.endTime}</div>
      </td>
      ${cells}
    </tr>`;
  }).join("");

  const dayHeaders = DAYS.map((day, i) => {
    const isToday = (i + 1) === todayDay;
    return `<th style="padding:10px 4px;font-size:10px;font-weight:700;text-align:center;background:${isToday ? "#10b981" : "#065f46"};color:#fff;border-right:1px solid rgba(255,255,255,.1);">
      <div>${DAY_SHORT[i]}</div>
      <div style="font-size:8px;font-weight:400;opacity:.75;margin-top:1px;">${day}</div>
    </th>`;
  }).join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <title>${titleLabel} – KALNET</title>
  <style>${BASE_CSS}
    .table-wrap{padding:20px 24px 16px;overflow-x:auto;}
    table{width:100%;border-collapse:collapse;table-layout:fixed;}
    .time-head{width:62px;background:#064e3b;color:#6ee7b7;font-size:9px;font-weight:700;text-align:center;padding:10px 4px;border-right:1px solid rgba(255,255,255,.1);}
  </style></head><body>
  <div class="print-bar"><button class="btn btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button></div>
  <div class="page">
    <div class="accent-band"></div>
    <div class="header">
      <div class="header-left">
        <div class="logo">KN</div>
        <div>
          <div class="school-name">KALNET SCHOOL</div>
          <div class="doc-title">${titleLabel.toUpperCase()}</div>
          ${subLabel ? `<div class="doc-sub">${subLabel}</div>` : ""}
        </div>
      </div>
      <div class="header-right">
        <div class="gen-date">Generated: ${dateStr}</div>
        <div class="acad-year">Academic Year 2025–26</div>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th class="time-head">PERIOD</th>
          ${dayHeaders}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="footer">
      <div class="footer-text">KALNET School · Timetable is subject to change. Always verify on the portal.</div>
      <div class="footer-copy">© ${now.getFullYear()} KALNET</div>
    </div>
    <div class="accent-band"></div>
  </div>
  <script>window.onload=function(){window.print();};</script>
</body></html>`;
}

// ─── MONTHLY HTML ─────────────────────────────────────────────────────────────
function generateMonthlyHTML(data: {
  titleLabel: string; subLabel: string;
  specials: any[];
  month: number; year: number;
}): string {
  const { titleLabel, subLabel, specials, month, year } = data;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const calDate = new Date(year, month - 1, 1);
  const monthName = calDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const getSpecialsForDate = (d: Date) =>
    specials.filter((s: any) => new Date(s.date).toDateString() === d.toDateString());

  // Build calendar days (Monday-start)
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const calDays: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) calDays.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) calDays.push(new Date(year, month - 1, d));
  // Pad to complete last row
  while (calDays.length % 7 !== 0) calDays.push(null);

  const today = new Date();

  // Build flat cells — events/specials only, no subject names
  const flatCells = calDays.map((day) => {
    if (!day) return `<td style="background:#f9fafb;border:1px solid #e5e7eb;min-height:88px;max-width:0;overflow:hidden;"></td>`;
    const daySpecials = getSpecialsForDate(day);
    const isToday = day.toDateString() === today.toDateString();
    const isSunday = day.getDay() === 0;

    const eventItems = daySpecials.slice(0, 3).map((s: any) => {
      const c = TYPE_COLOR[s.type] || "#6b7280";
      const bg = TYPE_BG[s.type] || "#f9fafb";
      return `<div style="margin-top:3px;padding:2px 4px;background:${bg};border-radius:3px;border-left:2px solid ${c};overflow:hidden;">
        <span style="display:block;font-size:7.5px;color:${c};font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;max-width:100%;">${s.title}</span>
      </div>`;
    }).join("");

    const overflow = daySpecials.length > 3
      ? `<div style="font-size:7px;color:#94a3b8;margin-top:2px;padding-left:2px;">+${daySpecials.length - 3} more</div>`
      : "";

    return `<td style="border:1px solid #e5e7eb;padding:5px 4px;vertical-align:top;background:${isSunday ? "#f9fafb" : "#fff"};max-width:0;overflow:hidden;">
      <div style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;margin-bottom:2px;background:${isToday ? "#10b981" : "transparent"};color:${isToday ? "#fff" : isSunday ? "#9ca3af" : "#1e293b"};">${day.getDate()}</div>
      ${eventItems}${overflow}
    </td>`;
  });

  const tableRows: string[] = [];
  for (let i = 0; i < flatCells.length; i += 7) {
    tableRows.push(`<tr style="height:90px;">${flatCells.slice(i, i + 7).join("")}</tr>`);
  }

  // Legend
  const legend = Object.entries(TYPE_COLOR).map(([type, color]) =>
    `<span style="display:inline-flex;align-items:center;gap:5px;font-size:9px;color:#64748b;margin-right:14px;">
      <span style="width:8px;height:8px;border-radius:50%;background:${color};"></span>${type.replace("_", " ")}
    </span>`
  ).join("");

  // All specials for the month
  const allSpecials = specials.map((s: any) => {
    const c = TYPE_COLOR[s.type] || "#6b7280";
    const bg = TYPE_BG[s.type] || "#f9fafb";
    const d = new Date(s.date);
    return `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 12px;background:${bg};border-left:3px solid ${c};border-radius:6px;margin-bottom:6px;">
      <div style="min-width:36px;text-align:center;">
        <div style="font-size:16px;font-weight:800;color:${c};line-height:1;">${d.getDate()}</div>
        <div style="font-size:8px;color:${c};font-weight:600;">${d.toLocaleDateString("en-IN",{month:"short"})}</div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;color:#1e293b;">${s.title}</div>
        ${s.description ? `<div style="font-size:9px;color:#64748b;margin-top:2px;">${s.description}</div>` : ""}
        <div style="font-size:8px;color:${c};font-weight:600;margin-top:3px;">${s.type.replace("_"," ")}${s.classEnrolled ? " · " + s.classEnrolled : ""}</div>
      </div>
    </div>`;
  }).join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <title>${titleLabel} – ${monthName} – KALNET</title>
  <style>${BASE_CSS}
    .cal-wrap{padding:20px 24px 16px;}
    .month-title{font-size:16px;font-weight:800;color:#065f46;text-align:center;margin-bottom:14px;letter-spacing:.5px;}
    table{width:100%;border-collapse:collapse;table-layout:fixed;}
    th{width:14.285%;background:#065f46;color:#fff;padding:8px 4px;font-size:10px;font-weight:700;text-align:center;border-right:1px solid rgba(255,255,255,.1);overflow:hidden;}
    th.sun-head{background:#047857;color:#a7f3d0;}
    td{width:14.285%;overflow:hidden;word-break:break-word;}
    .events-section{padding:0 24px 20px;}
    .events-title{font-size:11px;font-weight:700;color:#065f46;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;}
    .events-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;}
    .legend{padding:10px 24px;display:flex;flex-wrap:wrap;border-top:1px solid #f0fdf4;}
  </style></head><body>
  <div class="print-bar"><button class="btn btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button></div>
  <div class="page">
    <div class="accent-band"></div>
    <div class="header">
      <div class="header-left">
        <div class="logo">KN</div>
        <div>
          <div class="school-name">KALNET SCHOOL</div>
          <div class="doc-title">${titleLabel.toUpperCase()} · MONTHLY SCHEDULE</div>
          ${subLabel ? `<div class="doc-sub">${subLabel}</div>` : ""}
        </div>
      </div>
      <div class="header-right">
        <div class="gen-date">Generated: ${dateStr}</div>
        <div class="acad-year">Academic Year 2025–26</div>
      </div>
    </div>

    <div class="cal-wrap">
      <div class="month-title">${monthName}</div>
      <table>
        <thead><tr>
          ${WEEK_HEADERS.map(d => `<th class="${d === "Sun" ? "sun-head" : ""}">${d}</th>`).join("")}
        </tr></thead>
        <tbody>${tableRows.join("")}</tbody>
      </table>
    </div>

    <div class="legend">${legend}</div>

    ${specials.length > 0 ? `
    <div class="events-section">
      <div class="events-title">Events &amp; Special Schedules — ${monthName}</div>
      <div class="events-grid">${allSpecials}</div>
    </div>` : `
    <div style="padding:16px 24px 20px;text-align:center;color:#94a3b8;font-size:12px;">
      No events or special schedules for ${monthName}.
    </div>`}

    <div class="footer">
      <div class="footer-text">KALNET School · Schedule is subject to change. Always verify on the portal.</div>
      <div class="footer-copy">© ${now.getFullYear()} KALNET</div>
    </div>
    <div class="accent-band"></div>
  </div>
  <script>window.onload=function(){window.print();};</script>
</body></html>`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;

    const { searchParams } = new URL(req.url);
    const classParam = searchParams.get("class");
    const mode = searchParams.get("mode") || "weekly"; // "weekly" | "monthly"
    const monthParam = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const yearParam = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    let whereClause: any = {};
    let titleLabel = "Timetable";
    let subLabel = "";

    if (user.role === "STUDENT") {
      const student = await db.student.findUnique({ where: { id: parseInt(user.id) } });
      if (!student?.classEnrolled) return NextResponse.json({ error: "No class assigned" }, { status: 400 });
      whereClause.classEnrolled = student.classEnrolled;
      whereClause.isPublished = true;
      titleLabel = `${student.classEnrolled} Timetable`;
      subLabel = student.name || "";
    } else if (user.role === "CLASS_TEACHER") {
      whereClause.staffId = parseInt(user.id);
      titleLabel = "My Teaching Schedule";
      const staffRecord = await db.staff.findUnique({ where: { id: parseInt(user.id) } });
      subLabel = staffRecord?.name || "";
    } else if (user.role === "HOD") {
      const cls = classParam || "Class 6";
      whereClause.classEnrolled = cls;
      titleLabel = `${cls} Timetable`;
      subLabel = "HOD View";
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [entries, slots, specials] = await Promise.all([
      db.timetableEntry.findMany({
        where: whereClause,
        include: { slot: true, subject: true, classroom: true },
        orderBy: [{ dayOfWeek: "asc" }, { slot: { slotNumber: "asc" } }],
      }),
      db.timetableSlot.findMany({ orderBy: { slotNumber: "asc" } }),
      db.specialSchedule.findMany({
        where: {
          date: {
            gte: new Date(yearParam, monthParam - 1, 1),
            lte: new Date(yearParam, monthParam, 0),
          },
        },
        orderBy: { date: "asc" },
      }),
    ]);

    const staffMap: Record<number, string> = {};
    const allStaff = await db.staff.findMany({ select: { id: true, name: true } });
    allStaff.forEach((s: any) => { staffMap[s.id] = s.name; });

    const html = mode === "monthly"
      ? generateMonthlyHTML({ titleLabel, subLabel, specials, month: monthParam, year: yearParam })
      : generateWeeklyHTML({ titleLabel, subLabel, role: user.role, entries, slots, staffMap });

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": "inline" },
    });
  } catch (err: any) {
    console.error("Timetable export error:", err);
    return NextResponse.json({ error: "Failed to generate timetable" }, { status: 500 });
  }
}
