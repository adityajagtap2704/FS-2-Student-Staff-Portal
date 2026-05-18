import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import StudentTimetableClient from "./StudentTimetableClient";

export default async function TimetablePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role !== "STUDENT") redirect("/dashboard");

  return (
    <PageLayout session={session} title="My Timetable">
      <StudentTimetableClient session={session} />
    </PageLayout>
  );
}
