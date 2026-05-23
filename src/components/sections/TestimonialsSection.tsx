"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

/* ─── Data ──────────────────────────────────────────────────────── */
const testimonials = [
  {
    name: "Priya Sharma",
    role: "Grade 10 Student",
    avatar: "PS",
    color: "from-primary-500 to-primary-400",
    ring: "ring-primary-200",
    text: "Paying fees and checking announcements is so easy now. I love the clean interface — everything is exactly where I expect it to be.",
    rating: 5,
  },
  {
    name: "Rajesh Kumar",
    role: "Parent",
    avatar: "RK",
    color: "from-blue-500 to-blue-400",
    ring: "ring-blue-200",
    text: "The admission enquiry process was smooth and I got a reference number instantly. Very professional and well-designed portal.",
    rating: 5,
  },
  {
    name: "Ms. Anita Desai",
    role: "Class Teacher",
    avatar: "AD",
    color: "from-purple-500 to-purple-400",
    ring: "ring-purple-200",
    text: "Managing leave requests used to take hours. Now the approval chain runs automatically and I get notified in real time.",
    rating: 5,
  },
  {
    name: "Arjun Mehta",
    role: "Grade 12 Student",
    avatar: "AM",
    color: "from-amber-500 to-amber-400",
    ring: "ring-amber-200",
    text: "The fee payment reminder saved me from a late charge. The dashboard is super clean and works perfectly on my phone.",
    rating: 5,
  },
  {
    name: "Sunita Patel",
    role: "Parent",
    avatar: "SP",
    color: "from-rose-500 to-rose-400",
    ring: "ring-rose-200",
    text: "I can track my child's leave requests and fee status from one place. KALNET has made school communication so much better.",
    rating: 5,
  },
];

/* ─── Star component ────────────────────────────────────────────── */
function StarRating({ rating, delay = 0 }: { rating: number; delay?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, rotate: -30 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 15,
            delay: delay + i * 0.06,
          }}
          whileHover={{ scale: 1.3, rotate: 10 }}
        >
          <Star
            size={15}
            className={i < rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Single card ───────────────────────────────────────────────── */
function TestimonialCard({
  item,
  index,
  isActive,
}: {
  item: (typeof testimonials)[0];
  index: number;
  isActive: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.55,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -6, scale: 1.02 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col h-full rounded-2xl overflow-hidden cursor-default select-none"
      style={{
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: hovered
          ? "1px solid rgba(29,158,117,0.25)"
          : "1px solid rgba(229,231,235,0.8)",
        boxShadow: hovered
          ? "0 20px 60px rgba(29,158,117,0.10), 0 4px 20px rgba(0,0,0,0.06)"
          : "0 2px 16px rgba(0,0,0,0.05)",
        transition: "border 0.25s ease, box-shadow 0.25s ease",
      }}
    >
      {/* Spotlight glow follows cursor */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(180px circle at ${mousePos.x}px ${mousePos.y}px, rgba(29,158,117,0.07), transparent 70%)`,
        }}
      />

      {/* Top teal accent line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-400 via-primary-300 to-transparent"
        initial={{ scaleX: 0, originX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
      />

      <div className="relative flex flex-col gap-4 p-6 h-full">
        {/* Quote icon */}
        <motion.div
          className="absolute top-5 right-5 text-primary-100"
          animate={hovered ? { scale: 1.1, opacity: 0.6 } : { scale: 1, opacity: 0.3 }}
          transition={{ duration: 0.2 }}
        >
          <Quote size={28} />
        </motion.div>

        {/* Stars */}
        <StarRating rating={item.rating} delay={index * 0.08} />

        {/* Text */}
        <p className="text-sm text-gray-600 leading-relaxed flex-1 pr-4">
          &ldquo;{item.text}&rdquo;
        </p>

        {/* Divider */}
        <motion.div
          className="h-px bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"
          animate={hovered ? { opacity: 0.8 } : { opacity: 0.5 }}
        />

        {/* Author */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <motion.div
            className={`relative h-10 w-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ${item.ring} ring-offset-1`}
            whileHover={{ scale: 1.12, rotate: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {item.avatar}
            {/* Pulse ring */}
            <motion.div
              className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.color} opacity-40`}
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.3 }}
            />
          </motion.div>

          <div>
            <p className="text-sm font-semibold text-[#333] leading-tight">{item.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.role}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main section ──────────────────────────────────────────────── */
export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const total = testimonials.length;
  const VISIBLE = 3; // cards visible at once on desktop

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + total) % total);
  }, [total]);

  // Auto-advance every 3.5s
  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 3500);
    return () => clearInterval(id);
  }, [paused, next]);

  // Get visible indices (wrap around)
  const visibleIndices = Array.from({ length: VISIBLE }, (_, i) => (current + i) % total);

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden bg-[#f8fafb]">
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(29,158,117,0.06) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle, #1D9E75 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.p
            className="text-xs font-semibold text-primary uppercase tracking-widest mb-3"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
          >
            Testimonials
          </motion.p>
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-[#222] tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Loved by the{" "}
            <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              KALNET community
            </span>
          </motion.h2>
          <motion.p
            className="mt-3 text-gray-400 text-sm max-w-md mx-auto"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            Hear from students, parents, and staff who use KALNET every day.
          </motion.p>
        </motion.div>

        {/* ── Desktop: 3-card carousel ── */}
        <div
          className="hidden sm:block"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="grid grid-cols-3 gap-5 min-h-[260px]">
            <AnimatePresence mode="popLayout" custom={direction}>
              {visibleIndices.map((idx, pos) => (
                <motion.div
                  key={`${idx}-${current}`}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 60, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -direction * 60, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="h-full"
                >
                  <TestimonialCard item={testimonials[idx]} index={pos} isActive={pos === 1} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Mobile: single card ── */}
        <div
          className="sm:hidden"
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 40 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <TestimonialCard item={testimonials[current]} index={0} isActive={true} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-10">
          {/* Prev */}
          <motion.button
            onClick={prev}
            whileHover={{ scale: 1.08, backgroundColor: "rgba(29,158,117,0.08)" }}
            whileTap={{ scale: 0.94 }}
            className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary-200 transition-colors shadow-card"
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </motion.button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {testimonials.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                animate={{
                  width: i === current ? 24 : 8,
                  backgroundColor: i === current ? "#1D9E75" : "#d1d5db",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="h-2 rounded-full"
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>

          {/* Next */}
          <motion.button
            onClick={next}
            whileHover={{ scale: 1.08, backgroundColor: "rgba(29,158,117,0.08)" }}
            whileTap={{ scale: 0.94 }}
            className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary-200 transition-colors shadow-card"
            aria-label="Next"
          >
            <ChevronRight size={16} />
          </motion.button>

          {/* Pause / Play */}
          <motion.button
            onClick={() => setPaused((p) => !p)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary-200 transition-colors shadow-card ml-1"
            aria-label={paused ? "Play" : "Pause"}
          >
            <AnimatePresence mode="wait">
              {paused ? (
                <motion.div key="play" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ duration: 0.15 }}>
                  <Play size={14} />
                </motion.div>
              ) : (
                <motion.div key="pause" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ duration: 0.15 }}>
                  <Pause size={14} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Auto-progress bar */}
        <div className="mt-5 max-w-xs mx-auto h-0.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-300 rounded-full"
            key={`${current}-${paused}`}
            initial={{ width: "0%" }}
            animate={{ width: paused ? "0%" : "100%" }}
            transition={{ duration: paused ? 0 : 3.5, ease: "linear" }}
          />
        </div>
      </div>
    </section>
  );
}
