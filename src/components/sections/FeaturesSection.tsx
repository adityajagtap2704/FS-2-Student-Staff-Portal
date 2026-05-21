"use client";

import { useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { CreditCard, CalendarOff, Megaphone, Shield, ArrowRight, Sparkles } from "lucide-react";

/* ─── Data ──────────────────────────────────────────────────────── */
const features = [
  {
    icon: CreditCard,
    title: "Fee Management",
    desc: "View your complete fee balance, payment history, and pay online instantly. Get reminders before due dates.",
    accent: "#1D9E75",
    glow: "rgba(29,158,117,0.13)",
    gradientCard: "from-primary-50/60 to-white",
    iconBg: "rgba(29,158,117,0.10)",
    borderHover: "rgba(29,158,117,0.25)",
    tag: "Payments",
  },
  {
    icon: CalendarOff,
    title: "Leave Requests",
    desc: "Submit leave requests in seconds. Automatic approval chain triggers instantly — no paperwork needed.",
    accent: "#f59e0b",
    glow: "rgba(245,158,11,0.12)",
    gradientCard: "from-amber-50/60 to-white",
    iconBg: "rgba(245,158,11,0.10)",
    borderHover: "rgba(245,158,11,0.25)",
    tag: "Workflow",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    desc: "Stay updated with school notices, events, exam schedules, and important alerts in real time.",
    accent: "#3b82f6",
    glow: "rgba(59,130,246,0.12)",
    gradientCard: "from-blue-50/60 to-white",
    iconBg: "rgba(59,130,246,0.10)",
    borderHover: "rgba(59,130,246,0.25)",
    tag: "Updates",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "Enterprise-grade security protects your data. Role-based access ensures only the right people see the right info.",
    accent: "#8b5cf6",
    glow: "rgba(139,92,246,0.12)",
    gradientCard: "from-purple-50/60 to-white",
    iconBg: "rgba(139,92,246,0.10)",
    borderHover: "rgba(139,92,246,0.25)",
    tag: "Security",
  },
];

/* ─── Feature card ──────────────────────────────────────────────── */
function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const Icon = feature.icon;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setMouse({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -8, scale: 1.015 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col h-full rounded-2xl overflow-hidden cursor-default select-none"
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: hovered
          ? `1px solid ${feature.borderHover}`
          : "1px solid rgba(229,231,235,0.7)",
        boxShadow: hovered
          ? `0 24px 60px ${feature.glow}, 0 4px 20px rgba(0,0,0,0.05)`
          : "0 2px 16px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)",
        transition: "border 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      {/* Spotlight cursor glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-400"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(220px circle at ${mouse.x}px ${mouse.y}px, ${feature.glow}, transparent 70%)`,
        }}
      />

      {/* Animated top gradient border */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${feature.accent}, transparent)`,
        }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={inView ? { opacity: 1, scaleX: 1 } : {}}
        transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
      />

      {/* Card content */}
      <div className="relative flex flex-col gap-5 p-7 h-full">
        {/* Tag */}
        <div className="flex items-center justify-between">
          <motion.span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background: feature.iconBg,
              color: feature.accent,
            }}
            animate={hovered ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {feature.tag}
          </motion.span>

          {/* Arrow appears on hover */}
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={hovered ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }}
            transition={{ duration: 0.2 }}
            style={{ color: feature.accent }}
          >
            <ArrowRight size={15} />
          </motion.div>
        </div>

        {/* Icon */}
        <div className="relative w-fit">
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ background: feature.iconBg }}
            animate={
              hovered
                ? { scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }
                : { scale: 1, opacity: 0 }
            }
            transition={{ duration: 1.5, repeat: hovered ? Infinity : 0 }}
          />
          <motion.div
            className="relative h-14 w-14 rounded-2xl flex items-center justify-center"
            style={{ background: feature.iconBg }}
            whileHover={{ scale: 1.1, rotate: 6 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Icon size={24} style={{ color: feature.accent }} />
          </motion.div>
        </div>

        {/* Text */}
        <div className="flex-1">
          <motion.h3
            className="text-base font-bold tracking-tight mb-2"
            animate={{ color: hovered ? feature.accent : "#1a1a1a" }}
            transition={{ duration: 0.25 }}
          >
            {feature.title}
          </motion.h3>
          <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
        </div>

        {/* Bottom accent line */}
        <motion.div
          className="h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${feature.accent}, transparent)` }}
          initial={{ width: "0%" }}
          animate={inView ? { width: "40%" } : {}}
          transition={{ duration: 0.8, delay: index * 0.1 + 0.5 }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Main section ──────────────────────────────────────────────── */
export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  // Subtle parallax on background blobs
  const blobY1 = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const blobY2 = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-60px" });

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative py-24 sm:py-32 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #f0fdf8 0%, #f8fafb 40%, #ffffff 100%)",
      }}
    >
      {/* ── Background layer ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
          }}
        />

        {/* Radial glow behind heading */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[700px] rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(29,158,117,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Floating blobs with parallax */}
        <motion.div
          style={{ y: blobY1, background: "rgba(29,158,117,0.07)" }}
          className="absolute -top-20 -left-20 h-[400px] w-[400px] rounded-full blur-3xl"
          animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.06, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{ y: blobY2, background: "rgba(59,130,246,0.06)" }}
          className="absolute -bottom-20 -right-20 h-[350px] w-[350px] rounded-full blur-3xl"
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.08, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Subtle vertical shimmer lines */}
        {[18, 50, 82].map((x, i) => (
          <motion.div
            key={x}
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${x}%`,
              background: "linear-gradient(to bottom, transparent, rgba(29,158,117,0.12), transparent)",
            }}
            animate={{ opacity: [0, 0.7, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 1.2, ease: "easeInOut" }}
          />
        ))}

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: "radial-gradient(circle, #1D9E75 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative max-w-6xl mx-auto px-6">

        {/* Heading */}
        <div ref={headingRef} className="text-center mb-16">
          {/* Label */}
          <motion.div
            className="flex items-center justify-center gap-2 mb-4"
            initial={{ opacity: 0, y: 12 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={13} className="text-primary" />
            </motion.div>
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              Everything you need
            </span>
          </motion.div>

          {/* Main heading with gradient */}
          <motion.h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight"
            initial={{ opacity: 0, y: 16 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            Built for{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #1D9E75 0%, #38bc8e 50%, #059669 100%)",
              }}
            >
              students, parents
            </span>
            {" "}& staff
          </motion.h2>

          {/* Divider glow */}
          <motion.div
            className="mx-auto mt-5 mb-5 h-px max-w-[120px] rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(29,158,117,0.5), transparent)",
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={headingInView ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          />

          {/* Subtitle */}
          <motion.p
            className="text-gray-500 max-w-lg mx-auto text-base leading-relaxed"
            initial={{ opacity: 0, y: 12 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.18 }}
          >
            KALNET brings every school management task into one clean, fast, and intuitive portal.
          </motion.p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
