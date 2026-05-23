import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import PaymentsClient from "./PaymentsClient";

export const metadata = {
  title: "Payment History | KALNET",
  description: "View your payment history and download receipts",
};

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  const user = session.user as any;

  // Only students can view their payment history
  if (user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  return (
    <PageLayout session={session} title="Payment History">
      <PaymentsClient studentId={Number(user.id)} />
    </PageLayout>
  );
}
