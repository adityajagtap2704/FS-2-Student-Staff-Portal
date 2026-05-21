"use client";

import { motion } from "framer-motion";
import { fadeUp, easeOut } from "./MotionConfig";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={easeOut}
      className={className}
    >
      {children}
    </motion.div>
  );
}
