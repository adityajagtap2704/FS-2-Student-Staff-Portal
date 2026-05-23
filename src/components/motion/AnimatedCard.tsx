"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { staggerItem, easeOut } from "./MotionConfig";

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  hover?: boolean;
}

export default function AnimatedCard({
  children,
  delay = 0,
  hover = true,
  className = "",
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      initial="initial"
      animate="animate"
      transition={{ ...easeOut, delay }}
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
