"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem, easeOut } from "./MotionConfig";

interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol";
}

export function StaggerList({ children, className = "", as = "div" }: StaggerListProps) {
  const Tag = motion[as];
  return (
    <Tag
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </Tag>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "article" | "section";
}

export function StaggerItem({ children, className = "", delay = 0, as = "div" }: StaggerItemProps) {
  const Tag = motion[as];
  return (
    <Tag
      variants={staggerItem}
      transition={{ ...easeOut, delay }}
      className={className}
    >
      {children}
    </Tag>
  );
}
