import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PageLayout from "@/components/layout/PageLayout";
import FeesClient from "./FeesClient";

export const metadata = {
  title: "Fees",
};

export default async function StaffFeesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;
  if (user.role !== "CLASS_TEACHER") {
    redirect("/dashboard");
  }

  return (
    <PageLayout session={session} title="Fees">
      <FeesClient session={session} />
    </PageLayout>
  );
}
