"use client";

import { useState } from "react";
import { Session } from "next-auth";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { fadeUp, easeOut } from "@/components/motion/MotionConfig";

interface PageLayoutProps {
  session: Session | null;
  children: React.ReactNode;
  title?: string;
}

export default function PageLayout({ session, children, title }: PageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafb]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} session={session} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          session={session}
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-5 lg:p-6">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                variants={fadeUp}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={easeOut}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
