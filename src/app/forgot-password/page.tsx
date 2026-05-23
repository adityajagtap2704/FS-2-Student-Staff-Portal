"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, ArrowRight, Lock } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { staggerContainer, staggerItem, easeOut } from "@/components/motion/MotionConfig";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "password" | "success">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset email");
        return;
      }

      setStep("otp");
    } catch (err) {
      setError("Error requesting password reset");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp) {
      setError("Please enter the verification code");
      return;
    }

    setStep("password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please enter your new password");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError("Password must contain uppercase, lowercase, and numbers");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setStep("success");
    } catch (err) {
      setError("Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={easeOut}
          className="w-full max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-soft p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[#444] mb-2">Password Reset Successful!</h2>
            <p className="text-gray-600 mb-6">Your password has been reset successfully. You can now log in with your new password.</p>
            <Button
              onClick={() => router.push("/login")}
              variant="primary"
              fullWidth
              size="lg"
              iconRight={<ArrowRight size={16} />}
            >
              Go to Login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

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

      {/* Back to login */}
      <div className="relative w-full max-w-md mb-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors font-medium group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Login
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
              className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 items-center justify-center shadow-glow-lg mb-4"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Lock size={26} className="text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-[#444] tracking-tight">Reset Password</h1>
            <p className="mt-1 text-sm text-gray-400">
              {step === "email" && "Enter your email to receive a reset code"}
              {step === "otp" && "Enter the verification code sent to your email"}
              {step === "password" && "Create your new password"}
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={
              step === "email"
                ? handleRequestReset
                : step === "otp"
                ? handleVerifyOTP
                : handleResetPassword
            }
            className="space-y-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {step === "email" && (
              <motion.div variants={staggerItem} transition={{ ...easeOut, delay: 0.1 }}>
                <Input
                  label="Email address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  icon={<Mail size={15} />}
                  autoComplete="email"
                />
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div variants={staggerItem} transition={{ ...easeOut, delay: 0.1 }}>
                <Input
                  label="Verification Code"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Check your email for the verification code (expires in 15 minutes)
                </p>
              </motion.div>
            )}

            {step === "password" && (
              <>
                <motion.div variants={staggerItem} transition={{ ...easeOut, delay: 0.1 }}>
                  <label className="block text-sm font-medium text-[#444] mb-2">New Password</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <Lock size={15} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-12 py-2.5 text-sm text-[#444] placeholder:text-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must contain: uppercase, lowercase, numbers, 8+ characters
                  </p>
                </motion.div>

                <motion.div variants={staggerItem} transition={{ ...easeOut, delay: 0.15 }}>
                  <label className="block text-sm font-medium text-[#444] mb-2">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <Lock size={15} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-12 py-2.5 text-sm text-[#444] placeholder:text-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </motion.div>
              </>
            )}

            <AnimatePresence mode="wait">
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
            </AnimatePresence>

            <motion.div variants={staggerItem} transition={{ ...easeOut, delay: 0.2 }}>
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                iconRight={!loading ? <ArrowRight size={16} /> : undefined}
                className="mt-2"
              >
                {step === "email" && "Send Reset Code"}
                {step === "otp" && "Verify Code"}
                {step === "password" && "Reset Password"}
              </Button>
            </motion.div>
          </motion.form>
        </motion.div>
      </motion.div>
    </div>
  );
}
