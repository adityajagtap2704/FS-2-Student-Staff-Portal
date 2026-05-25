import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import DocumentVerificationClient from "./DocumentVerificationClient";

export default async function DocumentVerificationPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "HOD" && user.role !== "NON_TEACHING_STAFF") redirect("/dashboard");

  return (
    <PageLayout session={session} title="Document Verification">
      <DocumentVerificationClient />
    </PageLayout>
  );
}
