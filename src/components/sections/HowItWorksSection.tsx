"use client";

import { useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Users, BookOpen, CheckCircle2, ArrowRight, Zap } from "lucide-react";

/* ─── Data ──────────────────────────────────────────────────────── */
const steps = [
  {
    step: "01",
    icon: Users,
    title: "Create your account",
    desc: "Sign in with your school-issued credentials. No extra setup needed.",
    accent: "#1D9E75",
    lightBg: "rgba(29,158,117,0.08)",
    glow: "rgba(29,158,117,0.18)",
    tag: "Instant access",
  },
  {
    step: "02",
    icon: BookOpen,
    title: "Access your dashboard",
    desc: "See your fees, leave status, and announcements all in one place.",
    accent: "#3b82f6",
    lightBg: "rgba(59,130,246,0.08)",
    glow: "rgba(59,130,246,0.18)",
    tag: "All-in-one view",
  },
  {
    step: "03",
    icon: CheckCircle2,
    title: "Manage everything",
    desc: "Pay fees, submit leaves, read notices — done in seconds from any device.",
    accent: "#8b5cf6",
    lightBg: "rgba(139,92,246,0.08)",
    glow: "rgba(139,92,246,0.18)",
    tag: "Any device",
  },
];

/* ─── Animated connector ────────────────────────────────────────── */
function Connector({ index, trigger }: { index: number; trigger: boolean }) {
  return (
    <div className="hidden sm:flex absolute top-[52px] left-[calc(50%+52px)] right-0 items-center gap-1 overflow-hidden">
      {/* Dashed animated line */}
      <motion.div
        className="flex-1 h-px"
        style={{
          background: "repeating-linear-gradient(90deg, #1D9E75 0px, #1D9E75 6px, transparent 6px, transparent 14px)",
          backgroundSize: "14px 1px",
          originX: 0
        }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={trigger ? { opacity: 1, scaleX: 1 } : {}}
        transition={{ duration: 0.9, delay: 0.5 + index * 0.25, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Arrow tip */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={trigger ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.4, delay: 1.1 + index * 0.25 }}
      >
        <ArrowRight size={13} className="text-primary-300 shrink-0" />
      </motion.div>
    </div>
  );
}

/* ─── Step card ─────────────────────────────────────────────────── */
function StepCard({
  step: s,
  index,
  trigger,
}: {
  step: (typeof steps)[0];
  index: number;
  trigger: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const Icon = s.icon;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setMouse({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <motion.div
      ref={ref}
      className="relative flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 40 }}
      animate={trigger ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Connector line (between cards) */}
      {index < 2 && <Connector index={index} trigger={trigger} />}

      {/* Card */}
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="relative w-full rounded-2xl overflow-hidden p-7 cursor-default select-none"
        style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: hovered ? `1px solid ${s.glow}` : "1px solid rgba(229,231,235,0.7)",
          boxShadow: hovered
            ? `0 20px 50px ${s.lightBg}, 0 4px 16px rgba(0,0,0,0.04)`
            : "0 2px 12px rgba(0,0,0,0.04)",
          transition: "border 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        {/* Spotlight glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            background: `radial-gradient(180px circle at ${mouse.x}px ${mouse.y}px, ${s.lightBg}, transparent 70%)`,
          }}
        />

        {/* Top accent line */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, ${s.accent}, transparent)` }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={trigger ? { scaleX: 1 } : {}}
          transition={{ duration: 0.7, delay: index * 0.15 + 0.3 }}
        />

        {/* Step number badge */}
        <motion.div
          className="absolute top-4 right-4 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: s.lightBg, color: s.accent }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={trigger ? { opacity: 1, scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: index * 0.15 + 0.4 }}
        >
          {s.step}
        </motion.div>

        {/* Icon */}
        <div className="relative w-fit mx-auto mb-5">
          {/* Outer pulse ring */}
          <motion.div
            className="absolute -inset-3 rounded-2xl"
            style={{ background: s.lightBg }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: index * 0.5 }}
          />
          {/* Inner pulse ring */}
          <motion.div
            className="absolute -inset-1.5 rounded-2xl"
            style={{ background: s.lightBg }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: index * 0.5 + 0.3 }}
          />
          <motion.div
            className="relative h-16 w-16 rounded-2xl flex items-center justify-center"
            style={{ background: s.lightBg, border: `1px solid ${s.glow}` }}
            whileHover={{ scale: 1.1, rotate: 6 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Icon size={26} style={{ color: s.accent }} />
          </motion.div>
        </div>

        {/* Tag */}
        <motion.span
          className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3"
          style={{ background: s.lightBg, color: s.accent }}
          animate={hovered ? { scale: 1.05 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Zap size={9} />
          {s.tag}
        </motion.span>

        {/* Title */}
        <motion.h3
          className="text-base font-bold tracking-tight mb-2"
          animate={{ color: hovered ? s.accent : "#1a1a1a" }}
          transition={{ duration: 0.25 }}
        >
          {s.title}
        </motion.h3>

        {/* Desc */}
        <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>

        {/* Bottom progress bar */}
        <div className="mt-5 h-0.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${s.accent}, transparent)` }}
            initial={{ width: "0%" }}
            animate={trigger ? { width: "70%" } : {}}
            transition={{ duration: 1.2, delay: index * 0.15 + 0.5, ease: "easeOut" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main section ──────────────────────────────────────────────── */
export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const blobY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-60px" });

  return (
    <section
      id="how"
      ref={sectionRef}
      className="relative py-24 sm:py-32 overflow-hidden bg-white"
    >
      {/* ── Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(29,158,117,0.05) 0%, transparent 65%)" }}
        />
        {/* Parallax blob */}
        <motion.div
          style={{ y: blobY, background: "rgba(29,158,117,0.05)" }}
          className="absolute -bottom-32 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full blur-3xl"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: "radial-gradient(circle, #1D9E75 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        {/* Horizontal shimmer lines */}
        {[30, 60].map((y, i) => (
          <motion.div
            key={y}
            className="absolute left-0 right-0 h-px"
            style={{
              top: `${y}%`,
              background: "linear-gradient(90deg, transparent, rgba(29,158,117,0.10), transparent)",
            }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 1.5, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Heading */}
        <div ref={headingRef} className="text-center mb-16">
          <motion.div
            className="flex items-center justify-center gap-2 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45 }}
          >
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-primary"
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              Simple process
            </span>
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-primary"
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.9 }}
            />
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1a1a1a]"
            initial={{ opacity: 0, y: 16 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            Get started in{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #1D9E75 0%, #38bc8e 60%, #059669 100%)" }}
            >
              minutes
            </span>
          </motion.h2>

          {/* Glow divider */}
          <motion.div
            className="mx-auto mt-5 h-px max-w-[100px] rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, rgba(29,158,117,0.5), transparent)" }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={headingInView ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          />

          <motion.p
            className="mt-4 text-gray-400 max-w-md mx-auto text-base leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.18 }}
          >
            Three simple steps to access everything KALNET has to offer.
          </motion.p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <StepCard key={s.step} step={s} index={i} trigger={inView} />
          ))}
        </div>

        {/* Bottom CTA hint */}
        <motion.div
          className="flex items-center justify-center gap-2 mt-12 text-sm text-gray-400"
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <motion.div
            className="h-2 w-2 rounded-full bg-emerald-400"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          No credit card required · Free for all students
        </motion.div>
      </div>
    </section>
  );
}
