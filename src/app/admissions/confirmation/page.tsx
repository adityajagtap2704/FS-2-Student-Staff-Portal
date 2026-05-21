"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Copy, Check, Home } from "lucide-react";
import Button from "@/components/ui/Button";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [refNumber, setRefNumber] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setRefNumber(ref);
    } else {
      router.push("/admissions/enquire");
    }
  }, [searchParams, router]);

  const copyRef = async () => {
    if (!refNumber) return;
    await navigator.clipboard.writeText(refNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!refNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="animate-pulse bg-white p-8 rounded-3xl shadow-soft">
          <div className="h-6 w-32 bg-gray-200 rounded mx-auto mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-100/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-100/30 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-soft p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-5 animate-bounce-in">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#444]">Enquiry Submitted!</h2>
          <p className="mt-2 text-sm text-gray-400 max-w-xs mx-auto">
            Thank you for your interest in KALNET. Our admissions team will contact you within 2 business days.
          </p>

          <div className="mt-6 p-4 bg-primary-50 rounded-2xl border border-primary-100">
            <p className="text-xs font-medium text-primary-600 mb-2">Your Reference Number</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl font-bold text-primary tracking-wider font-mono">{refNumber}</span>
              <button
                onClick={copyRef}
                className="h-7 w-7 rounded-lg bg-white border border-primary-200 flex items-center justify-center text-primary hover:bg-primary-50 transition-colors"
                aria-label="Copy reference number"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
            <p className="text-xs text-primary-500 mt-2">Save this reference for future use</p>
          </div>

          <div className="mt-6 space-y-2">
            <Link href="/">
              <Button fullWidth variant="primary">
                <span className="flex items-center gap-2">
                  <Home size={16} /> Back to Home
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdmissionConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="animate-pulse bg-white p-8 rounded-3xl shadow-soft">
          <div className="h-6 w-32 bg-gray-200 rounded mx-auto mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
