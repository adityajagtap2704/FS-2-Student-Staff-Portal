"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, User, Phone, BookOpen, MessageSquare, ArrowRight, ArrowLeft, Calendar } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";

function validate(form: Record<string, string>) {
  const e: Record<string, string> = {};

  if (!form.studentName.trim())
    e.studentName = "Student name is required";
  else if (form.studentName.trim().length < 3)
    e.studentName = "Student name must be at least 3 characters";

  if (!form.parentName.trim())
    e.parentName = "Parent/guardian name is required";
  else if (form.parentName.trim().length < 3)
    e.parentName = "Parent name must be at least 3 characters";

  if (!form.email.trim())
    e.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    e.email = "Please enter a valid email address";

  if (!form.phone.trim())
    e.phone = "Phone number is required";
  else if (!/^\d{10}$/.test(form.phone.trim()))
    e.phone = "Phone number must be exactly 10 digits";

  if (!form.grade)
    e.grade = "Please select a class";

  if (!form.startDate)
    e.startDate = "Preferred start date is required";

  return e;
}

export default function AdmissionEnquiryPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    studentName: "",
    parentName:  "",
    email:       "",
    phone:       "",
    grade:       "",
    startDate:   "",
    message:     "",
  });
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Real-time validation on touched fields
  useEffect(() => {
    const errs = validate(form);
    const visibleErrs: Record<string, string> = {};
    Object.keys(errs).forEach((k) => {
      if (touched[k]) visibleErrs[k] = errs[k];
    });
    setErrors(visibleErrs);
  }, [form, touched]);

  const allErrors = validate(form);
  const isValid   = Object.keys(allErrors).length === 0;

  const touch = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Touch all fields to show all errors
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach((k) => (allTouched[k] = true));
    setTouched(allTouched);

    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      // Step 1: Send OTP to email
      const otpResponse = await fetch("/api/admissions/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email }),
      });

      const otpData = await otpResponse.json();

      if (!otpResponse.ok) {
        setErrors({ submit: otpData.message || "Failed to send OTP" });
        setLoading(false);
        return;
      }

      // Move to OTP verification step
      setStep("otp");
      setLoading(false);
    } catch {
      setErrors({ submit: "Failed to send OTP. Please try again." });
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode.trim() || otpCode.length !== 6) {
      setErrors({ otp: "Please enter a valid 6-digit OTP" });
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch("/api/admissions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...form,
          otp: otpCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          setErrors(data.errors);
        } else if (response.status === 409) {
          setErrors({ submit: data.error });
        } else {
          setErrors({ submit: data.message || "Failed to submit enquiry. Please try again." });
        }
        setOtpLoading(false);
        return;
      }

      router.push(`/admissions/confirmation?ref=${data.referenceNumber}`);
    } catch {
      setErrors({ submit: "Failed to submit enquiry. Please try again." });
      setOtpLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex flex-col p-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-100/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg mx-auto mb-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors font-medium group">
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
          <Link href="/login" className="text-sm text-primary hover:text-primary-600 font-medium transition-colors">
            Student Login →
          </Link>
        </div>
      </div>

      <div className="relative w-full max-w-lg mx-auto animate-fade-in flex-1">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-primary items-center justify-center shadow-glow-lg mb-4">
            <GraduationCap size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#444] tracking-tight">Admission Enquiry</h1>
          <p className="mt-1 text-sm text-gray-400">
            Fill in the form below and we&apos;ll get back to you within 2 business days.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-soft p-8">
          <form onSubmit={step === "form" ? handleSubmit : handleOTPSubmit} className="space-y-5" noValidate>

            {errors.submit && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.submit}
              </div>
            )}

            {step === "form" ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Student Name *"
                    placeholder="Min. 3 characters"
                    value={form.studentName}
                    onChange={(e) => {
                      // Only allow letters, spaces, hyphens, apostrophes
                      const value = e.target.value.replace(/[^a-zA-Z\s\-']/g, "");
                      setForm({ ...form, studentName: value });
                    }}
                    onBlur={() => touch("studentName")}
                    error={errors.studentName}
                    icon={<User size={15} />}
                  />
                  <Input
                    label="Parent / Guardian *"
                    placeholder="Min. 3 characters"
                    value={form.parentName}
                    onChange={(e) => {
                      // Only allow letters, spaces, hyphens, apostrophes
                      const value = e.target.value.replace(/[^a-zA-Z\s\-']/g, "");
                      setForm({ ...form, parentName: value });
                    }}
                    onBlur={() => touch("parentName")}
                    error={errors.parentName}
                    icon={<User size={15} />}
                  />
                </div>

                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="parent@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onBlur={() => touch("email")}
                  error={errors.email}
                  icon={<User size={15} />}
                  hint="We'll send updates to this email"
                />

                <Input
                  label="Phone Number *"
                  type="tel"
                  placeholder="Exactly 10 digits"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  onBlur={() => touch("phone")}
                  error={errors.phone}
                  icon={<Phone size={15} />}
                  hint="Must be exactly 10 digits"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-[#444]">Class *</label>
                    <div className="relative">
                      <BookOpen size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <select
                        value={form.grade}
                        onChange={(e) => setForm({ ...form, grade: e.target.value })}
                        onBlur={() => touch("grade")}
                        className={`w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-[#444] transition-all duration-200 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.grade ? "border-red-300" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <option value="">Select class...</option>
                        {Array.from({ length: 7 }, (_, i) => i + 6).map((g) => (
                          <option key={g} value={`Class ${g}`}>Class {g}</option>
                        ))}
                      </select>
                    </div>
                    {errors.grade && <p className="text-xs text-red-500">{errors.grade}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-[#444]">Preferred Start Date *</label>
                    <div className="relative">
                      <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        min={today}
                        value={form.startDate}
                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        onBlur={() => touch("startDate")}
                        className={`w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-[#444] transition-all duration-200 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.startDate ? "border-red-300" : "border-gray-200 hover:border-gray-300"}`}
                      />
                    </div>
                    {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
                  </div>
                </div>

                <Textarea
                  label="Message (Optional)"
                  placeholder="Any specific questions or requirements..."
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  icon={<MessageSquare size={15} />}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={loading}
                  disabled={!isValid && Object.keys(touched).length > 0}
                  iconRight={!loading ? <ArrowRight size={16} /> : undefined}
                >
                  {loading ? "Sending OTP..." : "Continue"}
                </Button>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-lg font-semibold text-[#444]">Verify Your Email</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    We&apos;ve sent a 6-digit OTP to <strong>{form.email}</strong>
                  </p>
                </div>

                {errors.otp && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.otp}
                  </div>
                )}

                <Input
                  label="Enter OTP *"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  hint="6-digit code sent to your email"
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    size="lg"
                    onClick={() => {
                      setStep("form");
                      setOtpCode("");
                      setErrors({});
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    loading={otpLoading}
                    disabled={otpCode.length !== 6}
                    iconRight={!otpLoading ? <ArrowRight size={16} /> : undefined}
                  >
                    {otpLoading ? "Verifying..." : "Verify & Submit"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Already a student?{" "}
          <Link href="/login" className="text-primary hover:text-primary-600 font-medium transition-colors">
            Sign in to your portal
          </Link>
        </p>
      </div>
    </div>
  );
}
