import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import ClassAssignmentsClient from "./ClassAssignmentsClient";

export const metadata = {
  title: "Class Assignments | KALNET",
  description: "View and manage staff class assignments",
};

export default async function ClassAssignmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  const user = session.user as any;

  // Only HOD can view class assignments
  if (user.role !== "HOD") {
    redirect("/dashboard");
  }

  return (
    <PageLayout session={session} title="Class Assignments">
      <ClassAssignmentsClient />
    </PageLayout>
  );
}
