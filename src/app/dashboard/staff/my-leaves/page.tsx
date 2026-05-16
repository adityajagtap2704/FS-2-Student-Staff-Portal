import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PageLayout from "@/components/layout/PageLayout";
import MyLeavesClient from "./MyLeavesClient";

export const metadata = {
  title: "My Leaves",
};

export default async function MyLeavesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;
  if (user.role !== "CLASS_TEACHER") {
    redirect("/dashboard");
  }

  return (
    <PageLayout session={session} title="My Leaves">
      <MyLeavesClient session={session} />
    </PageLayout>
  );
}
