import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import OutstandingPaymentsClient from "./OutstandingPaymentsClient";

export const metadata = {
  title: "Outstanding Payments | KALNET",
  description: "Create and manage outstanding/miscellaneous fees",
};

export default async function OutstandingPaymentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  const user = session.user as any;

  // Only HOD can manage outstanding payments
  if (user.role !== "HOD") {
    redirect("/dashboard");
  }

  return (
    <PageLayout session={session} title="Outstanding Payments">
      <OutstandingPaymentsClient />
    </PageLayout>
  );
}
