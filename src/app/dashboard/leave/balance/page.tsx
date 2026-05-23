import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import LeaveBalanceClient from "./LeaveBalanceClient";

export const metadata = {
  title: "Leave Balance | KALNET",
  description: "View your leave balance and monthly breakdown",
};

export default async function LeaveBalancePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  const user = session.user as any;

  // Only staff can view their leave balance
  if (user.role !== "CLASS_TEACHER" && user.role !== "HOD") {
    redirect("/dashboard");
  }

  return (
    <PageLayout session={session} title="Leave Balance">
      <LeaveBalanceClient />
    </PageLayout>
  );
}
