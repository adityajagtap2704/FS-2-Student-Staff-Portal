"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  GraduationCap, ArrowRight, CreditCard, CalendarOff,
  Megaphone, Shield, CheckCircle2, Users, BookOpen,
  ChevronRight, Sparkles,
} from "lucide-react";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import StatsSection from "@/components/sections/StatsSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";

/* ─── Data ─────────────────────────────────────────────────────── */
const features = [
  { icon: CreditCard,  title: "Fee Management",  desc: "View your complete fee balance, payment history, and pay online instantly. Get reminders before due dates.", color: "text-primary",   bg: "bg-primary-50",  border: "border-primary-100",  glow: "rgba(29,158,117,0.12)"  },
  { icon: CalendarOff, title: "Leave Requests",  desc: "Submit leave requests in seconds. Automatic approval chain triggers instantly — no paperwork needed.",       color: "text-amber-600", bg: "bg-amber-50",    border: "border-amber-100",    glow: "rgba(217,119,6,0.10)"   },
  { icon: Megaphone,   title: "Announcements",   desc: "Stay updated with school notices, events, exam schedules, and important alerts in real time.",               color: "text-blue-600",  bg: "bg-blue-50",     border: "border-blue-100",     glow: "rgba(37,99,235,0.10)"   },
  { icon: Shield,      title: "Secure & Private",desc: "Enterprise-grade security protects your data. Role-based access ensures only the right people see the right info.", color: "text-purple-600",bg: "bg-purple-50",  border: "border-purple-100",   glow: "rgba(124,58,237,0.10)"  },
];

const steps = [
  { step: "01", icon: Users,        title: "Create your account",   desc: "Sign in with your school-issued credentials. No extra setup needed."      },
  { step: "02", icon: BookOpen,     title: "Access your dashboard", desc: "See your fees, leave status, and announcements all in one place."         },
  { step: "03", icon: CheckCircle2, title: "Manage everything",     desc: "Pay fees, submit leaves, read notices — done in seconds from any device." },
];

/* ─── Animation variants ───────────────────────────────────────── */
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
};

/* ─── Spotlight card ───────────────────────────────────────────── */
function SpotlightCard({ children, glow, className = "" }: { children: React.ReactNode; glow: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, opacity: 1 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setPos((p) => ({ ...p, opacity: 0 }))}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 rounded-2xl"
        style={{
          opacity: pos.opacity,
          background: `radial-gradient(200px circle at ${pos.x}px ${pos.y}px, ${glow}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}

/* ─── Floating dots background ─────────────────────────────────── */
function FloatingDots() {
  const dots = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1.5,
    delay: Math.random() * 4,
    duration: Math.random() * 6 + 6,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute rounded-full bg-primary-300/30"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size }}
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Animated gradient border ─────────────────────────────────── */
function GradientBorderBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative inline-flex">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: "linear-gradient(90deg, #1D9E75, #38bc8e, #1D9E75)" }}
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <span className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-xs font-semibold text-primary-700 m-px">
        {children}
      </span>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────── */
export default function HomePage() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 300], [0, -40]);

  // Scroll state for navbar
  const [scrolled, setScrolled] = useState(false);
  const [scrolledFar, setScrolledFar] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      setScrolledFar(window.scrollY > 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ══ NAVBAR ══════════════════════════════════════════════ */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0)",
          backdropFilter: scrolled ? "blur(12px) saturate(180%)" : "blur(0px)",
          WebkitBackdropFilter: scrolled ? "blur(12px) saturate(180%)" : "blur(0px)",
          borderBottom: scrolled ? "1px solid rgba(229,231,235,0.6)" : "1px solid transparent",
          boxShadow: scrolledFar ? "0 4px 24px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div
          className="max-w-6xl mx-auto px-6 flex items-center justify-between transition-all duration-300"
          style={{ height: scrolled ? "60px" : "68px" }}
        >
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2.5"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <motion.div
              className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow"
              whileHover={{ rotate: 8, scale: 1.08 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <GraduationCap size={18} className="text-white" />
            </motion.div>
            <div>
              <span
                className="text-base font-bold transition-colors duration-300"
                style={{ color: scrolled ? "#444" : "#222" }}
              >
                KALNET
              </span>
              <span
                className="hidden sm:inline ml-2 text-xs transition-colors duration-300"
                style={{ color: scrolled ? "#9ca3af" : "#6b7280" }}
              >
                School Portal
              </span>
            </div>
          </motion.div>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {[
              { label: "Features",     href: "#features" },
              { label: "How it works", href: "#how"      },
              { label: "Admissions",   href: "/admissions/enquire" },
              { label: "Announcements",href: "/announcements" },
            ].map(({ label, href }) => (
              <motion.div
                key={label}
                whileHover={{ y: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Link
                  href={href}
                  className="relative px-3 py-1.5 text-sm font-medium transition-colors duration-200 group"
                  style={{ color: scrolled ? "#555" : "#444" }}
                >
                  {label}
                  <span className="absolute bottom-0 left-3 right-3 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-primary text-white text-sm font-semibold shadow-glow hover:shadow-glow-lg hover:brightness-105 transition-all duration-200"
            >
              Sign In
              <motion.span
                animate={{ x: [0, 2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight size={14} />
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* Spacer so hero content isn't hidden under fixed nav */}
      <div className="h-[68px]" />

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/60 via-white to-white">
        <FloatingDots />

        {/* Animated blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary-100/50 blur-3xl"
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.7, 0.5], x: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/2 -left-32 h-[400px] w-[400px] rounded-full bg-blue-100/40 blur-3xl"
            animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.5, 0.3], y: [0, -20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-primary-50/60 blur-3xl"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
        </div>

        <motion.div
          style={{ y: heroY }}
          className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center"
        >
          <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">

            {/* Badge */}
            <motion.div variants={fadeUp} className="flex justify-center">
              <GradientBorderBadge>
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-primary-500"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                Trusted by 2,400+ students across KALNET
              </GradientBorderBadge>
            </motion.div>

            {/* Headline with shimmer */}
            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#222] tracking-tight leading-[1.1]"
            >
              The modern portal
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 bg-clip-text text-transparent">
                  for KALNET
                </span>
                {/* Underline shimmer */}
                <motion.span
                  className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-200 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed"
            >
              A premium student and staff portal. Manage fees, leaves, announcements,
              and admissions — all in one beautifully designed place.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-primary text-white font-semibold text-base shadow-glow hover:shadow-glow-lg transition-all duration-200 w-full sm:w-auto justify-center"
                >
                  Sign In
                  <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                <Link
                  href="/admissions/enquire"
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-primary text-white font-semibold text-base shadow-glow hover:shadow-glow-lg transition-all duration-200 w-full sm:w-auto justify-center"
                >
                  👨‍🎓 Student Admission
                  <ChevronRight size={17} className="group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-primary text-white font-semibold text-base shadow-glow hover:shadow-glow-lg transition-all duration-200 w-full sm:w-auto justify-center"
                >
                  👨‍🏫 Staff Registration
                  <ChevronRight size={17} className="group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust line */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-400 pt-1">
              {["Free for all students", "No setup required", "Secure & private"].map((t, i) => (
                <span key={t} className="flex items-center gap-1.5">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.8 + i * 0.1 }}
                  >
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  </motion.div>
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══ STATS ═══════════════════════════════════════════════ */}
      <StatsSection />

      {/* ══ FEATURES ════════════════════════════════════════════ */}
      <FeaturesSection />

      {/* ══ HOW IT WORKS ════════════════════════════════════════ */}
      <HowItWorksSection />

      {/* ══ TESTIMONIALS ════════════════════════════════════════ */}
      <TestimonialsSection />

      {/* ══ CTA BANNER ══════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 sm:p-16 text-center text-white shadow-glow-lg"
          >
            {/* Animated mesh */}
            <div className="absolute inset-0 bg-mesh-pattern opacity-20 pointer-events-none" />

            {/* Floating orbs inside banner */}
            <motion.div
              className="absolute top-4 left-8 h-20 w-20 rounded-full bg-white/10 blur-xl"
              animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-4 right-8 h-28 w-28 rounded-full bg-white/10 blur-xl"
              animate={{ y: [0, 12, 0], x: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            <div className="relative">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-3"
              >
                Ready to get started?
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
              >
                Join the KALNET portal today
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-white/70 max-w-lg mx-auto mb-8 text-base"
              >
                Students, parents, and staff — everything you need is one login away.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3"
              >
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-primary font-semibold text-base hover:bg-primary-50 transition-colors shadow-soft w-full sm:w-auto justify-center"
                  >
                    Sign In <ArrowRight size={17} />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                  <Link
                    href="/admissions/enquire"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-primary font-semibold text-base hover:bg-primary-50 transition-colors shadow-soft w-full sm:w-auto justify-center"
                  >
                    👨‍🎓 Student Admission
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-primary font-semibold text-base hover:bg-primary-50 transition-colors shadow-soft w-full sm:w-auto justify-center"
                  >
                    👨‍🏫 Staff Registration
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <motion.div
            className="flex items-center gap-2.5"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-primary flex items-center justify-center">
              <GraduationCap size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-[#444]">KALNET</span>
          </motion.div>
          <p className="text-xs text-gray-400 text-center">
            © 2026 KALNET School Management System · Built with Next.js 14
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            {[{ label: "Login", href: "/login" }, { label: "Admissions", href: "/admissions/enquire" }].map(({ label, href }) => (
              <motion.div key={label} whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                <Link href={href} className="hover:text-primary transition-colors">{label}</Link>
              </motion.div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
