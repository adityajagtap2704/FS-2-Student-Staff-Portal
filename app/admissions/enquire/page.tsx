"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, User, Mail, Phone, BookOpen, MessageSquare, ArrowRight, ArrowLeft, Calendar } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";

function generateRef() {
  return "KN-ENQ-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function AdmissionEnquiryPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    studentName: "",
    parentName: "",
    email: "",
    phone: "",
    grade: "",
    startDate: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.studentName.trim()) e.studentName = "Student name is required";
    if (!form.parentName.trim())  e.parentName  = "Parent/guardian name is required";
    if (form.email.trim() && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email address";
    
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^\d+$/.test(form.phone)) e.phone = "Phone number must be numeric";
    else if (form.phone.length < 8) e.phone = "Phone number is too short";

    if (!form.grade) e.grade = "Please select a class";
    if (!form.startDate) e.startDate = "Preferred start date is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    
    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to submit");
      
      const data = await res.json();
      setLoading(false);
      
      // Redirect to confirmation page with ref number from DB
      router.push(`/admissions/confirmation?ref=${data.referenceNumber}`);
    } catch (error) {
      console.error("Submission error:", error);
      setErrors({ submit: "Failed to submit enquiry. Please try again." });
      setLoading(false);
    }
  };

  // Get today's date for minimum date constraint
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex flex-col p-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-100/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />
      </div>

      {/* Top nav bar */}
      <div className="relative w-full max-w-lg mx-auto mb-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors font-medium group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
          <Link href="/login" className="text-sm text-primary hover:text-primary-600 font-medium transition-colors">
            Student Login →
          </Link>
        </div>
      </div>

      <div className="relative w-full max-w-lg mx-auto animate-fade-in flex-1">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-primary items-center justify-center shadow-glow-lg mb-4">
            <GraduationCap size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#444] tracking-tight">Admission Enquiry</h1>
          <p className="mt-1 text-sm text-gray-400">
            Fill in the form below and we&apos;ll get back to you within 2 business days.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-soft p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Student Name *"
                placeholder="Full name"
                value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                error={errors.studentName}
                icon={<User size={15} />}
              />
              <Input
                label="Parent / Guardian *"
                placeholder="Full name"
                value={form.parentName}
                onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                error={errors.parentName}
                icon={<User size={15} />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address (Optional)"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={errors.email}
                icon={<Mail size={15} />}
              />
              <Input
                label="Phone Number *"
                type="tel"
                placeholder="Numeric only"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                error={errors.phone}
                icon={<Phone size={15} />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Grade select */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#444]">Class *</label>
                <div className="relative">
                  <BookOpen size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className={`
                      w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-[#444]
                      transition-all duration-200 appearance-none
                      focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                      shadow-inner-sm
                      ${errors.grade ? "border-red-300" : "border-gray-200 hover:border-gray-300"}
                    `}
                  >
                    <option value="">Select class...</option>
                    {Array.from({ length: 7 }, (_, i) => i + 6).map((grade) => (
                      <option key={grade} value={`Class ${grade}`}>Class {grade}</option>
                    ))}
                  </select>
                </div>
                {errors.grade && <p className="text-xs text-red-500">{errors.grade}</p>}
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#444]">Preferred Start Date *</label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    min={today}
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className={`
                      w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-[#444]
                      transition-all duration-200 appearance-none
                      focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                      shadow-inner-sm
                      ${errors.startDate ? "border-red-300" : "border-gray-200 hover:border-gray-300"}
                    `}
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
              iconRight={!loading ? <ArrowRight size={16} /> : undefined}
            >
              {loading ? "Submitting..." : "Submit Enquiry"}
            </Button>
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
