"use client";

import { HTMLAttributes } from "react";
import { motion } from "framer-motion";
import { staggerItem, easeOut } from "@/components/motion/MotionConfig";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  noPadding?: boolean;
  glass?: boolean;
  hover?: boolean;
  action?: React.ReactNode;
  animate?: boolean;
  delay?: number;
}

export default function Card({
  title,
  subtitle,
  noPadding = false,
  glass = false,
  hover = false,
  action,
  animate = true,
  delay = 0,
  className = "",
  children,
  ...props
}: CardProps) {
  const content = (
    <>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-50">
          <div>
            {title && <h3 className="text-sm font-semibold text-[#444]">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
          </div>
          {action && <div className="ml-4 shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "p-6"}>{children}</div>
    </>
  );

  const baseClass = `
    rounded-2xl border border-gray-100 shadow-card
    ${glass ? "bg-white/70 backdrop-blur-xl" : "bg-white"}
    ${className}
  `;

  if (!animate) {
    return (
      <div className={baseClass} {...props}>
        {content}
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerItem}
      initial="initial"
      animate="animate"
      transition={{ ...easeOut, delay }}
      whileHover={hover ? { y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" } : undefined}
      className={baseClass}
      {...(props as React.ComponentProps<typeof motion.div>)}
    >
      {content}
    </motion.div>
  );
}
