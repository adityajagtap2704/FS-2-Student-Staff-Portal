import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import BonafideClient from "./BonafideClient";

export default async function BonafidePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "STUDENT") redirect("/dashboard");

  return (
    <PageLayout session={session} title="Bonafide Certificate">
      <BonafideClient />
    </PageLayout>
  );
}
