export function logAdmissionAction(
  action: "CREATE" | "APPROVE" | "REJECT",
  admissionId: number,
  userId: string,
  userRole: string,
  success: boolean,
  error?: string
): void {
  const status = success ? "SUCCESS" : "FAILURE";
  console.log(`[AUDIT] ADMISSION_${action} | ID: ${admissionId} | User: ${userId} | Role: ${userRole} | Status: ${status}${error ? ` | Error: ${error}` : ""}`);
}

export function logLeaveAction(
  action: "CREATE" | "APPROVE" | "REJECT" | "CANCEL",
  leaveId: number,
  userId: string,
  userRole: string,
  success: boolean,
  error?: string
): void {
  const status = success ? "SUCCESS" : "FAILURE";
  console.log(`[AUDIT] LEAVE_${action} | ID: ${leaveId} | User: ${userId} | Role: ${userRole} | Status: ${status}${error ? ` | Error: ${error}` : ""}`);
}

export function logFeeAction(
  action: "VIEW" | "UPDATE" | "PAYMENT",
  feeId: number,
  userId: string,
  userRole: string,
  success: boolean,
  error?: string
): void {
  const status = success ? "SUCCESS" : "FAILURE";
  console.log(`[AUDIT] FEE_${action} | ID: ${feeId} | User: ${userId} | Role: ${userRole} | Status: ${status}${error ? ` | Error: ${error}` : ""}`);
}

export function logProfileUpdate(
  userId: string,
  userRole: string,
  success: boolean,
  error?: string
): void {
  const status = success ? "SUCCESS" : "FAILURE";
  console.log(`[AUDIT] PROFILE_UPDATE | User: ${userId} | Role: ${userRole} | Status: ${status}${error ? ` | Error: ${error}` : ""}`);
}
