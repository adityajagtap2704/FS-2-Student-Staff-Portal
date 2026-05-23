import { NextResponse } from "next/server";

export interface ErrorResponse {
  error: string;
  code: string;
  status: number;
  timestamp: string;
  details?: Record<string, any>;
}

export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_FIELD: "MISSING_FIELD",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  DUPLICATE_PHONE: "DUPLICATE_PHONE",
  DUPLICATE_NAME: "DUPLICATE_NAME",
  OVERLAPPING_LEAVE: "OVERLAPPING_LEAVE",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  PAYMENT_EXCEEDS_AMOUNT: "PAYMENT_EXCEEDS_AMOUNT",
  MONTHLY_LIMIT_EXCEEDED: "MONTHLY_LIMIT_EXCEEDED",
  YEARLY_LIMIT_EXCEEDED: "YEARLY_LIMIT_EXCEEDED",
  MAXIMUM_DURATION_EXCEEDED: "MAXIMUM_DURATION_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export function errorResponse(
  message: string,
  code: string,
  status: number = 400,
  details?: Record<string, any>
): NextResponse {
  const response: ErrorResponse = {
    error: message,
    code,
    status,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
  };
  return NextResponse.json(response, { status });
}

export function validationError(
  message: string,
  details?: Record<string, string>
): NextResponse {
  return errorResponse(message, ErrorCodes.VALIDATION_ERROR, 422, details);
}

export function unauthorizedError(): NextResponse {
  return errorResponse("Unauthorized - please login", ErrorCodes.UNAUTHORIZED, 401);
}

export function forbiddenError(reason?: string): NextResponse {
  return errorResponse(reason || "Forbidden", ErrorCodes.FORBIDDEN, 403);
}

export function notFoundError(resource: string): NextResponse {
  return errorResponse(`${resource} not found`, ErrorCodes.NOT_FOUND, 404);
}
