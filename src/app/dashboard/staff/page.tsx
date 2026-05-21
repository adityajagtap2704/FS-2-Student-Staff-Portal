import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import StaffClient from "./StaffClient";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "CLASS_TEACHER") redirect("/dashboard");

  return (
    <PageLayout session={session} title="Staff Dashboard">
      <StaffClient session={session} />
    </PageLayout>
  );
}
