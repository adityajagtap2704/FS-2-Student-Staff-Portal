import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import ProfileClient from "./ProfileClient";
<<<<<<< HEAD
import StaffProfileClient from "./StaffProfileClient";
=======
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
import db from "@/lib/db";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

<<<<<<< HEAD
  const user = session.user as { id: string; role: string };
  const userId = parseInt(user.id);

  // If user is staff (CLASS_TEACHER, NON_TEACHING_STAFF, HOD), show staff profile
  if (user.role === "CLASS_TEACHER" || user.role === "NON_TEACHING_STAFF" || user.role === "HOD") {
    const staff = await db.staff.findUnique({
      where: { id: userId },
    });

    if (!staff) redirect("/login");

    return (
      <PageLayout session={session} title="My Profile">
        <StaffProfileClient staff={staff} />
      </PageLayout>
    );
  }

  // Otherwise, show student profile
  const student = await db.student.findUnique({
    where: { id: userId },
=======
  const user = session.user as { id: string };
  const studentId = parseInt(user.id);

  const student = await db.student.findUnique({
    where: { id: studentId },
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
    include: {
      fees: true,
      leaveRequests: true,
    }
  });

  if (!student) redirect("/login");

  return (
    <PageLayout session={session} title="My Profile">
      <ProfileClient student={student} />
    </PageLayout>
  );
}
