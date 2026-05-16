import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PageLayout from "@/components/layout/PageLayout";
import PaymentsClient from "./PaymentsClient";

export const metadata = {
  title: "Payments",
};

export default async function StaffPaymentsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;
  if (user.role !== "CLASS_TEACHER") {
    redirect("/dashboard");
  }

  return (
    <PageLayout session={session} title="Payments">
      <PaymentsClient session={session} />
    </PageLayout>
  );
}
