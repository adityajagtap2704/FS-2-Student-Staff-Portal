import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import StaffTimetableClient from "./StaffTimetableClient";

export default async function StaffTimetablePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role !== "CLASS_TEACHER") redirect("/dashboard");

  return (
    <PageLayout session={session} title="My Timetable">
      <StaffTimetableClient session={session} />
    </PageLayout>
  );
}
