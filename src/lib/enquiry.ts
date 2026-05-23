import db from "@/lib/db";

/**
 * Generate a unique enquiry number in format: ENQ-YYYY-XXX
 * Example: ENQ-2026-001
 */
export async function generateEnquiryNumber(): Promise<string> {
  const year = new Date().getFullYear();
  
  // Count existing enquiries for this year
  const count = await db.student.count({
    where: {
      enquiryNumber: {
        startsWith: `ENQ-${year}-`,
      },
    },
  });

  const sequenceNumber = String(count + 1).padStart(3, "0");
  return `ENQ-${year}-${sequenceNumber}`;
}

/**
 * Generate a unique admission reference number in format: ENQ-YYYYMM-XXXX
 * Example: ENQ-202605-AB12
 */
export async function generateAdmissionReferenceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const yearMonth = `${year}${month}`;

  // Count existing admissions for this month
  const count = await db.admission.count({
    where: {
      referenceNumber: {
        startsWith: `ENQ-${yearMonth}-`,
      },
    },
  });

  // Generate 4-character alphanumeric suffix
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  let num = count;
  for (let i = 0; i < 4; i++) {
    suffix = chars[num % chars.length] + suffix;
    num = Math.floor(num / chars.length);
  }

  return `ENQ-${yearMonth}-${suffix}`;
}
