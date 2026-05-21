"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StaffSignupRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main signup page
    router.push("/signup");
  }, [router]);

  return null;
}
