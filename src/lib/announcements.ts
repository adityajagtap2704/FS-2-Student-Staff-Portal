/** Announcement target: STAFF = class teachers (teaching staff) only */

export type AnnouncementTargetValue = "STUDENT" | "STAFF" | "NON_TEACHING_STAFF" | "BOTH";

export const ANNOUNCEMENT_TARGETS = {
  STUDENT: "STUDENT",
  STAFF: "STAFF",
  NON_TEACHING_STAFF: "NON_TEACHING_STAFF",
  BOTH: "BOTH",
} as const;

export const TARGET_LABELS: Record<AnnouncementTargetValue, string> = {
  STUDENT: "Students",
  STAFF: "Teaching Staff",
  NON_TEACHING_STAFF: "Non-Teaching Staff",
  BOTH: "All (Students, Teaching Staff & Non-Teaching Staff)",
};

export function canManageAnnouncements(role: string | undefined): boolean {
  return role === "HOD" || role === "NON_TEACHING_STAFF";
}

/** Targets allowed when creating (NTS: student or teaching staff only; HOD: all) */
export function allowedTargetsForRole(role: string | undefined): AnnouncementTargetValue[] {
  if (role === "HOD") return ["STUDENT", "STAFF", "NON_TEACHING_STAFF", "BOTH"];
  if (role === "NON_TEACHING_STAFF") return ["STUDENT", "STAFF", "BOTH"];
  return [];
}

export function isValidTargetForRole(
  role: string | undefined,
  target: string | undefined
): target is AnnouncementTargetValue {
  if (!target) return false;
  return allowedTargetsForRole(role).includes(target as AnnouncementTargetValue);
}

/** Prisma `where.target` filter for listing announcements a role may read */
export function announcementReadFilter(role: string | undefined): { target?: { in: AnnouncementTargetValue[] } } {
  if (role === "STUDENT") {
    return { target: { in: ["STUDENT", "BOTH"] } };
  }
  if (role === "CLASS_TEACHER") {
    return { target: { in: ["STAFF", "BOTH"] } };
  }
  if (role === "NON_TEACHING_STAFF") {
    return { target: { in: ["NON_TEACHING_STAFF", "BOTH"] } };
  }
  // HOD: no filter (sees all)
  return {};
}

export function canViewAnnouncement(role: string | undefined, target: string | null | undefined): boolean {
  const t = (target ?? "BOTH") as AnnouncementTargetValue;
  if (role === "HOD") return true;
  if (role === "STUDENT") return t === "STUDENT" || t === "BOTH";
  if (role === "CLASS_TEACHER") return t === "STAFF" || t === "BOTH";
  if (role === "NON_TEACHING_STAFF") return t === "NON_TEACHING_STAFF" || t === "BOTH";
  return false;
}

export function targetBadgeLabel(target: string | null | undefined): string {
  const t = target ?? "BOTH";
  if (t === "STUDENT") return "Students Only";
  if (t === "STAFF") return "Teaching Staff Only";
  if (t === "NON_TEACHING_STAFF") return "Non-Teaching Staff Only";
  return "All (Students, Teaching Staff & Non-Teaching Staff)";
}
