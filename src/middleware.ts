import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token    = req.nextauth.token as any;
    const role     = token?.role as string | undefined;
    const pathname = req.nextUrl.pathname;

    // HOD routes — only HOD
    if (pathname.startsWith("/dashboard/hod") && role !== "HOD") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Staff routes — only CLASS_TEACHER
    if (pathname.startsWith("/dashboard/staff") && role !== "CLASS_TEACHER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Student-only routes — block staff/HOD from student pages
    const studentOnlyPaths = [
      "/dashboard/fees",
      "/dashboard/leave",
      "/dashboard/profile",
    ];
    if (
      studentOnlyPaths.some((p) => pathname.startsWith(p)) &&
      role !== "STUDENT"
    ) {
      if (role === "HOD")           return NextResponse.redirect(new URL("/dashboard/hod",   req.url));
      if (role === "CLASS_TEACHER") return NextResponse.redirect(new URL("/dashboard/staff", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
