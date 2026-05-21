"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Users, Star, Briefcase, Trophy } from "lucide-react";

/* ─── Data ──────────────────────────────────────────────────────── */
const stats = [
  {
    icon: Users,
    value: 2400,
    suffix: "+",
    label: "Students Enrolled",
    desc: "Active this year",
    color: "#1D9E75",
    lightBg: "rgba(29,158,117,0.08)",
    ring: "rgba(29,158,117,0.2)",
    bar: "from-primary-500 to-primary-300",
    percent: 92,
  },
  {
    icon: Star,
    value: 98,
    suffix: "%",
    label: "Satisfaction Rate",
    desc: "From student surveys",
    color: "#f59e0b",
    lightBg: "rgba(245,158,11,0.08)",
    ring: "rgba(245,158,11,0.2)",
    bar: "from-amber-500 to-amber-300",
    percent: 98,
  },
  {
    icon: Briefcase,
    value: 150,
    suffix: "+",
    label: "Staff Members",
    desc: "Dedicated educators",
    color: "#3b82f6",
    lightBg: "rgba(59,130,246,0.08)",
    ring: "rgba(59,130,246,0.2)",
    bar: "from-blue-500 to-blue-300",
    percent: 75,
  },
  {
    icon: Trophy,
    value: 12,
    suffix: "",
    label: "Years of Excellence",
    desc: "Established 2014",
    color: "#8b5cf6",
    lightBg: "rgba(139,92,246,0.08)",
    ring: "rgba(139,92,246,0.2)",
    bar: "from-purple-500 to-purple-300",
    percent: 60,
  },
];

/* ─── Count-up hook ─────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1800, delay = 0, trigger = false) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    let raf: number;
    const timer = setTimeout(() => {
      let startTime: number | null = null;
      const tick = (ts: number) => {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(eased * target));
        if (progress < 1) raf = requestAnimationFrame(tick);
        else { setCount(target); setDone(true); }
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [trigger, target, duration, delay]);

  return { count, done };
}

/* ─── Circular progress ring ────────────────────────────────────── */
function CircleRing({
  percent,
  color,
  trigger,
  delay,
}: {
  percent: number;
  color: string;
  trigger: boolean;
  delay: number;
}) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    if (!trigger) return;
    const timer = setTimeout(() => {
      setOffset(circ - (percent / 100) * circ);
    }, delay + 200);
    return () => clearTimeout(timer);
  }, [trigger, percent, circ, delay]);

  return (
    <svg width="72" height="72" className="absolute inset-0 -rotate-90">
      {/* Track */}
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="3" />
      {/* Progress */}
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: `stroke-dashoffset 1.6s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms` }}
      />
    </svg>
  );
}

/* ─── Single stat card ──────────────────────────────────────────── */
function StatCard({
  stat,
  index,
  trigger,
}: {
  stat: (typeof stats)[0];
  index: number;
  trigger: boolean;
}) {
  const { count, done } = useCountUp(stat.value, 1800, index * 150, trigger);
  const [hovered, setHovered] = useState(false);
  const Icon = stat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      animate={trigger ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.55,
        delay: index * 0.12,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -6, scale: 1.02 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col gap-3 p-5 rounded-2xl bg-white border border-gray-100 overflow-hidden cursor-default select-none"
      style={{
        boxShadow: hovered
          ? `0 20px 50px ${stat.lightBg}, 0 4px 16px rgba(0,0,0,0.05)`
          : "0 2px 12px rgba(0,0,0,0.04)",
        borderColor: hovered ? stat.ring : "rgba(229,231,235,0.9)",
        transition: "box-shadow 0.3s ease, border-color 0.3s ease",
      }}
    >
      {/* Animated top border */}
      <motion.div
        className={`absolute top-0 left-0 h-0.5 bg-gradient-to-r ${stat.bar}`}
        initial={{ width: "0%" }}
        animate={trigger ? { width: "100%" } : {}}
        transition={{ duration: 0.8, delay: index * 0.12 + 0.3, ease: "easeOut" }}
      />

      {/* Background glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ background: `radial-gradient(circle at 50% 0%, ${stat.lightBg}, transparent 70%)` }}
      />

      {/* Icon + ring */}
      <div className="relative flex items-center justify-between">
        <div className="relative h-[72px] w-[72px]">
          <CircleRing
            percent={stat.percent}
            color={stat.color}
            trigger={trigger}
            delay={index * 150}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{ background: stat.lightBg }}
            whileHover={{ scale: 1.08, rotate: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Icon size={22} style={{ color: stat.color }} />
          </motion.div>
        </div>

        {/* Done checkmark badge */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="h-6 w-6 rounded-full flex items-center justify-center"
              style={{ background: stat.lightBg }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <motion.path
                  d="M2 6l3 3 5-5"
                  stroke={stat.color}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Number */}
      <div>
        <motion.p
          className="text-4xl font-bold tracking-tight leading-none"
          animate={done ? { scale: [1, 1.04, 1] } : {}}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ color: hovered ? stat.color : "#1a1a1a", transition: "color 0.25s ease" }}
        >
          {count.toLocaleString()}{stat.suffix}
        </motion.p>
        <p className="mt-1.5 text-sm font-semibold text-[#333]">{stat.label}</p>
        <p className="mt-0.5 text-xs text-gray-400">{stat.desc}</p>
      </div>

      {/* Animated progress bar */}
      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${stat.bar}`}
          initial={{ width: "0%" }}
          animate={trigger ? { width: `${stat.percent}%` } : {}}
          transition={{ duration: 1.6, delay: index * 0.15 + 0.4, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Main section ──────────────────────────────────────────────── */
export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative border-y border-gray-100 bg-white overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-[900px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(29,158,117,0.04) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle, #1D9E75 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Label */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-primary-200"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-[11px] font-semibold text-primary-600 tracking-widest uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
            Impact in numbers
          </span>
          <motion.div
            className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-primary-200"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </motion.div>

        {/* 4-column grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} trigger={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
