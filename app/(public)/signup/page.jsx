"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Montserrat, Playfair_Display } from "next/font/google";
import { registerUser } from "@/actions/authActions";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const playfair   = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"] });

const FI = `w-full bg-[#FDFCFC] border border-[#EDE5F0] rounded-xl px-4 py-3.5 text-[13.5px]
  text-[#1a1a1a] placeholder:text-[#C4B3CE] outline-none
  focus:border-[#7A2267]/40 focus:shadow-[0_0_0_3px_rgba(122,34,103,0.06)]
  transition-all duration-200`;

// Steps: "info" → "otp" → "password" → done
export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState("info");  // "info" | "otp" | "password"
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [otp,      setOtp]      = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [resendCd, setResendCd] = useState(0);

  // Step 1: Send OTP
  async function handleSendOtp(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError("Please fill in all fields."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send OTP."); return; }
      setStep("otp");
      startResendCountdown();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startResendCountdown() {
    setResendCd(60);
    const iv = setInterval(() => {
      setResendCd((v) => { if (v <= 1) { clearInterval(iv); return 0; } return v - 1; });
    }, 1000);
  }

  async function handleResendOtp() {
    if (resendCd > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to resend."); return; }
      startResendCountdown();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP
  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otp.trim()) { setError("Enter the OTP code."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp, purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid code."); return; }
      setStep("password");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Set password & register
  async function handleRegister(e) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError("");
    setLoading(true);
    try {
      const result = await registerUser({ name, email, password });
      if (result.error) { setError(result.error); return; }
      // Auto sign in
      const res = await signIn("credentials", { redirect: false, email, password });
      if (res?.ok) {
        router.push("/");
        router.refresh();
      } else {
        router.push("/login?registered=true");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const STEP_LABELS = ["Your Info", "Verify Email", "Set Password"];
  const stepIdx = { info: 0, otp: 1, password: 2 }[step];

  return (
    <div className={`min-h-screen bg-[#F7F4F0] flex flex-col items-center justify-center px-4 py-16 ${montserrat.className}`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px]"
      >
        {/* Logo */}
        <Link href="/" className="flex justify-center mb-10">
          <Image src="/logo.png" alt="Dhali's Amber Nivaas" width={110} height={36} className="object-contain" priority />
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.07)] overflow-hidden">
          <div className="h-[3px] bg-[#7A2267]" />
          <div className="px-8 pt-8 pb-9">

            {/* Step indicator */}
            <div className="flex items-center gap-0 mb-8">
              {STEP_LABELS.map((label, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors duration-300
                      ${i < stepIdx ? "bg-[#7A2267] text-white" : i === stepIdx ? "bg-[#7A2267] text-white shadow-[0_0_0_3px_rgba(122,34,103,0.15)]" : "bg-[#F0E8F4] text-[#C4B3CE]"}`}>
                      {i < stepIdx ? (
                        <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                          <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className={`text-[9px] mt-1 font-semibold uppercase tracking-wide transition-colors duration-300
                      ${i <= stepIdx ? "text-[#7A2267]" : "text-[#C4B3CE]"}`}>{label}</span>
                  </div>
                  {i < 2 && (
                    <div className={`flex-1 h-px mx-1 mb-4 transition-colors duration-300
                      ${i < stepIdx ? "bg-[#7A2267]" : "bg-[#EDE5F0]"}`} />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div key="err"
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-5 text-[12px] text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Step 1: Info ── */}
            {step === "info" && (
              <motion.div key="info"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <h1 className={`text-[24px] font-semibold text-[#1a1410] mb-1 ${playfair.className}`}>
                  Create account
                </h1>
                <p className="text-[12.5px] text-[#9B8BAB] mb-6 font-light">
                  Join Dhali&apos;s Amber Nivaas for exclusive reservations.
                </p>

                {/* Google signup */}
                <button
                  onClick={() => signIn("google", { callbackUrl: "/" })}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#7A2267]/20
                    hover:border-[#7A2267]/50 hover:shadow-[0_2px_12px_rgba(122,34,103,0.10)]
                    py-3 rounded-xl transition-all duration-200 group mb-5"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-[13px] font-semibold text-[#1a1a1a] group-hover:text-[#7A2267] transition-colors">
                    Sign up with Google
                  </span>
                  <span className="text-[10px] font-semibold bg-[#7A2267] text-white px-2 py-0.5 rounded-full ml-1">
                    Recommended
                  </span>
                </button>

                <div className="relative flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-[#EDE5F0]" />
                  <span className="text-[10px] text-[#C4B3CE] font-medium uppercase tracking-wider">or with email</span>
                  <div className="flex-1 h-px bg-[#EDE5F0]" />
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1.5">Full Name</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      className={FI} placeholder="Your full name" autoComplete="name" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1.5">Email Address</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className={FI} placeholder="name@example.com" autoComplete="email" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13px]
                      py-3.5 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]
                      disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Sending code…" : "Continue with Email"}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── Step 2: OTP ── */}
            {step === "otp" && (
              <motion.div key="otp"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <h1 className={`text-[24px] font-semibold text-[#1a1410] mb-1 ${playfair.className}`}>
                  Verify your email
                </h1>
                <p className="text-[12.5px] text-[#9B8BAB] mb-6 font-light">
                  We sent a 6-digit code to <strong className="text-[#7A2267]">{email}</strong>
                </p>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1.5">Verification Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className={`${FI} text-center text-[22px] tracking-[0.35em] font-bold`}
                      placeholder="000000"
                      autoComplete="one-time-code"
                    />
                  </div>
                  <button type="submit" disabled={loading || otp.length < 6}
                    className="w-full bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13px]
                      py-3.5 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]
                      disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Verifying…" : "Verify Code"}
                  </button>
                </form>

                <div className="flex items-center justify-between mt-4">
                  <button onClick={() => { setStep("info"); setOtp(""); setError(""); }}
                    className="text-[12px] text-[#9B8BAB] hover:text-[#7A2267] transition-colors font-medium">
                    ← Change email
                  </button>
                  <button onClick={handleResendOtp} disabled={resendCd > 0 || loading}
                    className="text-[12px] text-[#7A2267] font-semibold disabled:opacity-40 hover:underline disabled:no-underline transition-colors">
                    {resendCd > 0 ? `Resend in ${resendCd}s` : "Resend code"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Password ── */}
            {step === "password" && (
              <motion.div key="password"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <h1 className={`text-[24px] font-semibold text-[#1a1410] mb-1 ${playfair.className}`}>
                  Set your password
                </h1>
                <p className="text-[12.5px] text-[#9B8BAB] mb-6 font-light">
                  Choose a secure password for your account.
                </p>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${FI} pr-10`}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                      />
                      <button type="button" tabIndex={-1}
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4B3CE] hover:text-[#9B8BAB] transition-colors">
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                          <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
                          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
                        </svg>
                      </button>
                    </div>
                    {/* Password strength hint */}
                    {password.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {[1,2,3,4].map((n) => (
                          <div key={n} className={`flex-1 h-1 rounded-full transition-colors duration-300
                            ${password.length >= n * 3 ? (n <= 1 ? "bg-red-400" : n === 2 ? "bg-amber-400" : n === 3 ? "bg-yellow-400" : "bg-emerald-400") : "bg-[#EDE5F0]"}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={loading || password.length < 8}
                    className="w-full bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13px]
                      py-3.5 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]
                      disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Creating account…" : "Create Account"}
                  </button>
                </form>
              </motion.div>
            )}

            {step !== "otp" && (
              <p className="text-center text-[12px] text-[#9B8BAB] mt-6">
                Already have an account?{" "}
                <Link href="/login" className="text-[#7A2267] font-semibold hover:underline">Sign in</Link>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
