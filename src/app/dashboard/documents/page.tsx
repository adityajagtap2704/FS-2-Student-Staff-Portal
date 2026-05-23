import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import DocumentsClient from "./DocumentsClient";

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "STUDENT") redirect("/dashboard");

  return (
    <PageLayout session={session} title="Documents">
      <DocumentsClient studentId={parseInt(user.id)} />
    </PageLayout>
  );
}
