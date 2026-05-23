/**
 * Phase 3: Input Validation
 * Comprehensive validation utilities for all inputs
 */

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate phone number (10 digits)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ""));
}

/**
 * Validate name (min 3 chars, no special chars)
 */
export function validateName(name: string, minLength: number = 3): boolean {
  if (!name || name.trim().length < minLength) return false;
  // Allow letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  return nameRegex.test(name.trim());
}

/**
 * Validate class/grade (6-12)
 */
export function validateClass(grade: string): boolean {
  // Accept both "10" and "Class 10" formats
  const classNumber = grade.replace(/[^\d]/g, ""); // Extract just the number
  return /^(6|7|8|9|10|11|12)$/.test(classNumber);
}

/**
 * Validate date is in future
 */
export function validateFutureDate(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj >= today;
}

/**
 * Validate date range
 */
export function validateDateRange(
  fromDate: Date | string,
  toDate: Date | string
): boolean {
  const from = typeof fromDate === "string" ? new Date(fromDate) : fromDate;
  const to = typeof toDate === "string" ? new Date(toDate) : toDate;
  return from <= to;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  strength: "weak" | "medium" | "strong";
  message: string;
} {
  if (password.length < 8) {
    return {
      valid: false,
      strength: "weak",
      message: "Password must be at least 8 characters",
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

  if (strengthScore < 2) {
    return {
      valid: false,
      strength: "weak",
      message: "Password must contain uppercase, lowercase, numbers, and special characters",
    };
  }

  if (strengthScore < 3) {
    return {
      valid: true,
      strength: "medium",
      message: "Password strength is medium",
    };
  }

  return {
    valid: true,
    strength: "strong",
    message: "Password strength is strong",
  };
}

/**
 * Validate admission form
 */
export function validateAdmissionForm(data: {
  studentName?: string;
  parentName?: string;
  email?: string;
  phone?: string;
  grade?: string;
  startDate?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.studentName?.trim() || data.studentName.trim().length < 3) {
    errors.studentName = "Student name must be at least 3 characters";
  }

  if (!data.parentName?.trim() || data.parentName.trim().length < 3) {
    errors.parentName = "Parent name must be at least 3 characters";
  }

  if (!data.email?.trim() || !validateEmail(data.email)) {
    errors.email = "Valid email is required";
  }

  if (!data.phone?.trim() || !validatePhone(data.phone)) {
    errors.phone = "Phone number must be exactly 10 digits";
  }

  if (!data.grade || !validateClass(data.grade)) {
    errors.grade = "Class must be between 6 and 12";
  }

  if (!data.startDate || !validateFutureDate(data.startDate)) {
    errors.startDate = "Start date must be in the future";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate leave request form
 */
export function validateLeaveForm(data: {
  type?: string;
  from?: string;
  to?: string;
  reason?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.type?.trim()) {
    errors.type = "Leave type is required";
  }

  if (!data.from) {
    errors.from = "Start date is required";
  }

  if (!data.to) {
    errors.to = "End date is required";
  }

  if (data.from && data.to && !validateDateRange(data.from, data.to)) {
    errors.to = "End date must be after start date";
  }

  if (!data.reason?.trim() || data.reason.trim().length < 5) {
    errors.reason = "Reason must be at least 5 characters";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate profile update form
 */
export function validateProfileForm(data: {
  parentName?: string;
  phone?: string;
  parentEmail?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.parentName && !validateName(data.parentName)) {
    errors.parentName = "Parent name must be at least 3 characters";
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = "Phone number must be exactly 10 digits";
  }

  if (data.parentEmail && !validateEmail(data.parentEmail)) {
    errors.parentEmail = "Valid email is required";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Sanitize string input (remove dangerous characters)
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ""); // Remove event handlers
}

/**
 * Sanitize object (sanitize all string values)
 */
export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
