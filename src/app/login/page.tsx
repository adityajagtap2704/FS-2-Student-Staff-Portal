"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, Mail, Lock, ArrowRight, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { staggerContainer, staggerItem, easeOut } from "@/components/motion/MotionConfig";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Fix #16 — redirect already-authenticated users away from login
  useEffect(() => {
    if (redirecting) return; // Don't redirect multiple times
    
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role;
      if (role === "HOD") {
        setRedirecting(true);
        router.replace("/dashboard/hod");
      } else if (role === "CLASS_TEACHER") {
        setRedirecting(true);
        router.replace("/dashboard/staff");
      } else {
        setRedirecting(true);
        router.replace("/dashboard");
      }
    }
  }, [status, session, router, redirecting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const result = await signIn("credentials", { 
        email, 
        password, 
        redirect: false 
      });
      
      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
      } else if (result?.ok) {
        // Sign-in successful, the useEffect will handle redirection based on role
        // Don't set loading to false - keep it true to show loading state
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex flex-col items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary-100/40 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Back to home */}
      <div className="relative w-full max-w-md mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors font-medium group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>
      </div>

      <motion.div
        className="relative w-full max-w-md"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Card */}
        <motion.div
          variants={staggerItem}
          transition={easeOut}
          className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-soft p-8"
        >
          {/* Logo */}
          <motion.div
            className="text-center mb-8"
            variants={staggerItem}
            transition={{ ...easeOut, delay: 0.05 }}
          >
            <motion.div
              className="inline-flex h-14 w-14 rounded-2xl bg-gradient-primary items-center justify-center shadow-glow-lg mb-4"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <GraduationCap size={26} className="text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-[#444] tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-gray-400">Sign in to your KALNET portal</p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={staggerItem} transition={{ ...easeOut, delay: 0.1 }}>
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                icon={<Mail size={15} />}
                autoComplete="email"
              />
            </motion.div>

            <motion.div variants={staggerItem} transition={{ ...easeOut, delay: 0.15 }}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-[#444]">Password</label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:text-primary-dark font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Roll Number (e.g. KN-2024-001)"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-12 py-2.5 text-sm text-[#444] placeholder:text-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </motion.div>

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </motion.div>
            )}

            <motion.div variants={staggerItem} transition={{ ...easeOut, delay: 0.2 }}>
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                iconRight={!loading ? <ArrowRight size={16} /> : undefined}
                className="mt-2"
              >
                Sign In
              </Button>
            </motion.div>
          </motion.form>



          <motion.div
            variants={staggerItem}
            transition={{ ...easeOut, delay: 0.3 }}
            className="mt-8 pt-6 border-t border-gray-200 space-y-3"
          >
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">New here?</p>
            
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">👨‍🎓 Students:</span> Apply through admission enquiry
              </p>
              <Link
                href="/admissions/enquire"
                className="block w-full px-4 py-2 rounded-lg bg-primary-50 border border-primary-200 text-primary font-medium hover:bg-primary-100 transition-colors text-center text-sm"
              >
                Start Admission Enquiry
              </Link>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">👨‍🏫 Staff:</span> Create your staff account
              </p>
              <Link
                href="/signup"
                className="block w-full px-4 py-2 rounded-lg bg-primary-50 border border-primary-200 text-primary font-medium hover:bg-primary-100 transition-colors text-center text-sm"
              >
                Create Staff Account
              </Link>
            </div>
          </motion.div>
        </motion.div>

        <motion.p
          variants={staggerItem}
          transition={{ ...easeOut, delay: 0.35 }}
          className="mt-4 text-center text-xs text-gray-400"
        >
          © 2026 KALNET School Management System
        </motion.p>
      </motion.div>
    </div>
  );
}
