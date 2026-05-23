import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import HodClient from "./HodClient";

export default async function HodPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "HOD") redirect("/dashboard");

  return (
    <PageLayout session={session} title="HOD Dashboard">
      <HodClient session={session} />
    </PageLayout>
  );
}
