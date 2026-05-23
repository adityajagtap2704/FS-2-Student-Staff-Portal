import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PageLayout from "@/components/layout/PageLayout";
import MyStudentsClient from "../my-students/MyStudentsClient";

export const metadata = {
  title: "My Students",
};

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;
  if (user.role !== "CLASS_TEACHER") {
    redirect("/dashboard");
  }

  return (
    <PageLayout session={session} title="My Students">
      <MyStudentsClient session={session} />
    </PageLayout>
  );
}
