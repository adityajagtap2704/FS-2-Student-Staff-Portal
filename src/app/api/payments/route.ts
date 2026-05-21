import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listPaymentsForRole } from "@/lib/paymentDb";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session || !user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "50");

    if (user.role === "STUDENT") {
      const payments = await listPaymentsForRole({ role: "STUDENT", studentId: Number(user.id), limit });
      return NextResponse.json({ payments });
    }

    if (user.role === "CLASS_TEACHER") {
      const payments = await listPaymentsForRole({ role: "CLASS_TEACHER", assignedClass: user.assignedClass, limit });
      return NextResponse.json({ payments });
    }

    if (user.role === "HOD") {
      const payments = await listPaymentsForRole({ role: "HOD", limit });
      return NextResponse.json({ payments });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("Payments List Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

