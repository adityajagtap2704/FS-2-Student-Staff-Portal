/**
 * Chronological helpers — newest / latest first (descending).
 */

export function toTimestamp(value: Date | string | number | null | undefined): number {
  if (value == null) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Newest first */
export function compareDesc(
  a: Date | string | number | null | undefined,
  b: Date | string | number | null | undefined
): number {
  return toTimestamp(b) - toTimestamp(a);
}

/** Oldest first (payment allocation, installment sequence) */
export function compareAsc(
  a: Date | string | number | null | undefined,
  b: Date | string | number | null | undefined
): number {
  return toTimestamp(a) - toTimestamp(b);
}

export function sortByDesc<T>(
  items: T[],
  getDate: (item: T) => Date | string | number | null | undefined
): T[] {
  return [...items].sort((x, y) => compareDesc(getDate(x), getDate(y)));
}

export const prismaOrder = {
  announcement: [{ date: "desc" as const }, { createdAt: "desc" as const }],
  // Fees: paid first (most recently paid at top), then unpaid by soonest due date
  fee: [{ paidAt: "desc" as const }, { dueDate: "asc" as const }],
  submittedAt: { submittedAt: "desc" as const },
  requestedAt: { requestedAt: "desc" as const },
  createdAt: { createdAt: "desc" as const },
  uploadedAt: { uploadedAt: "desc" as const },
  paidAt: { paidAt: "desc" as const },
  receivedAt: { receivedAt: "desc" as const },
  date: { date: "desc" as const },
};
