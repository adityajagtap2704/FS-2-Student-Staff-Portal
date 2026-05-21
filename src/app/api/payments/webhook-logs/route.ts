import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Only HOD can view webhook logs
    if (user.role !== "HOD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const event = url.searchParams.get("event");
    const status = url.searchParams.get("status");

    const webhookLogs = await db.paymentWebhookLog.findMany({
      where: {
        ...(event && { event }),
        ...(status && { status }),
      },
      orderBy: { receivedAt: "desc" },
      take: limit,
    });

    return NextResponse.json(webhookLogs);
  } catch (error) {
    console.error("Webhook Logs GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      event,
      razorpayOrderId,
      razorpayPaymentId,
      payload,
      status,
      errorMessage,
    } = body;

    if (!event || !payload) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const webhookLog = await db.paymentWebhookLog.create({
      data: {
        event,
        razorpayOrderId,
        razorpayPaymentId,
        payload: typeof payload === "string" ? payload : JSON.stringify(payload),
        status: status || "PENDING",
        errorMessage,
      },
    });

    return NextResponse.json(webhookLog);
  } catch (error) {
    console.error("Webhook Logs POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
