import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import NonTeachingAdmissionsClient from "./NonTeachingAdmissionsClient";

export default async function NonTeachingAdmissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "NON_TEACHING_STAFF") redirect("/dashboard");

  return (
    <PageLayout session={session} title="Admissions">
      <NonTeachingAdmissionsClient />
    </PageLayout>
  );
}
