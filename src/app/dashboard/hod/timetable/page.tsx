import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import HodTimetableClient from "./HodTimetableClient";

export default async function HodTimetablePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role !== "HOD") redirect("/dashboard");

  return (
    <PageLayout session={session} title="Timetable Management">
      <HodTimetableClient session={session} />
    </PageLayout>
  );
}
