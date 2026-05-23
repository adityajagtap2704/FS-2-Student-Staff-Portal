import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import FeesClient from "./FeesClient";

export default async function FeesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <PageLayout session={session} title="Fees">
      <FeesClient />
    </PageLayout>
  );
}
