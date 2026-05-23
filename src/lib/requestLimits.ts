import { NextRequest, NextResponse } from "next/server";

/**
 * Phase 3: Request Size Limits
 * Prevents abuse and protects against large payload attacks
 */

// Maximum request body sizes (in bytes)
export const REQUEST_LIMITS = {
  DEFAULT: 1024 * 100, // 100 KB
  UPLOAD: 1024 * 1024 * 10, // 10 MB
  FORM: 1024 * 50, // 50 KB
  JSON: 1024 * 100, // 100 KB
};

/**
 * Check request size
 */
export async function checkRequestSize(
  req: NextRequest,
  maxSize: number = REQUEST_LIMITS.DEFAULT
): Promise<{ valid: boolean; error?: string }> {
  try {
    const contentLength = req.headers.get("content-length");
    
    if (!contentLength) {
      return { valid: true };
    }

    const size = parseInt(contentLength, 10);
    
    if (size > maxSize) {
      return {
        valid: false,
        error: `Request body exceeds maximum size of ${maxSize / 1024} KB`,
      };
    }

    return { valid: true };
  } catch (error) {
    console.error("[REQUEST LIMIT] Error checking request size:", error);
    return { valid: true }; // Allow if check fails
  }
}

/**
 * Middleware to enforce request size limits
 */
export function withRequestSizeLimit(maxSize: number = REQUEST_LIMITS.DEFAULT) {
  return async (req: NextRequest) => {
    const check = await checkRequestSize(req, maxSize);
    
    if (!check.valid) {
      return NextResponse.json(
        {
          error: check.error,
          code: "REQUEST_TOO_LARGE",
          status: 413,
          timestamp: new Date().toISOString(),
        },
        { status: 413 }
      );
    }

    return null; // Continue to next middleware
  };
}

/**
 * Get safe request body with size limit
 */
export async function getSafeRequestBody(
  req: NextRequest,
  maxSize: number = REQUEST_LIMITS.JSON
): Promise<{ data?: any; error?: string }> {
  try {
    const check = await checkRequestSize(req, maxSize);
    
    if (!check.valid) {
      return { error: check.error };
    }

    const data = await req.json();
    return { data };
  } catch (error) {
    console.error("[REQUEST LIMIT] Error parsing request body:", error);
    return { error: "Invalid request body" };
  }
}

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts
  },
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 uploads per hour
  },
};

/**
 * Simple in-memory rate limiter (for development)
 * In production, use Redis or similar
 */
class RateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (entry.count < limit) {
      entry.count++;
      return true;
    }

    return false;
  }

  reset(key: string): void {
    this.store.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Check rate limit
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const allowed = rateLimiter.check(key, limit, windowMs);
  const entry = (rateLimiter as any).store.get(key);
  
  return {
    allowed,
    remaining: Math.max(0, limit - (entry?.count || 0)),
    resetTime: entry?.resetTime || Date.now() + windowMs,
  };
}
