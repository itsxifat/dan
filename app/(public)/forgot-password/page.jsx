"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Montserrat, Playfair_Display } from "next/font/google";
import { resetPassword } from "@/actions/authActions";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const playfair   = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"] });

const FI = `w-full bg-[#FDFCFC] border border-[#EDE5F0] rounded-xl px-4 py-3.5 text-[13.5px]
  text-[#1a1a1a] placeholder:text-[#C4B3CE] outline-none
  focus:border-[#7A2267]/40 focus:shadow-[0_0_0_3px_rgba(122,34,103,0.06)]
  transition-all duration-200`;

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step,     setStep]     = useState("email");   // "email" | "otp" | "newpass" | "done"
  const [email,    setEmail]    = useState("");
  const [otp,      setOtp]      = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [resendCd, setResendCd] = useState(0);

  function startResendCountdown() {
    setResendCd(60);
    const iv = setInterval(() => {
      setResendCd((v) => { if (v <= 1) { clearInterval(iv); return 0; } return v - 1; });
    }, 1000);
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "reset_password" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send OTP."); return; }
      setStep("otp");
      startResendCountdown();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCd > 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "reset_password" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed."); return; }
      startResendCountdown();
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp, purpose: "reset_password" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid code."); return; }
      setStep("newpass");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError("");
    setLoading(true);
    try {
      const result = await resetPassword({ email, password });
      if (result.error) { setError(result.error); return; }
      setStep("done");
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  }

  return (
    <div className={`min-h-screen bg-[#F7F4F0] flex flex-col items-center justify-center px-4 py-16 ${montserrat.className}`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px]"
      >
        <Link href="/" className="flex justify-center mb-10">
          <Image src="/logo.png" alt="Dhali's Amber Nivaas" width={110} height={36} className="object-contain" priority />
        </Link>

        <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.07)] overflow-hidden">
          <div className="h-[3px] bg-[#7A2267]" />
          <div className="px-8 pt-8 pb-9">

            <AnimatePresence mode="wait">
              {error && (
                <motion.div key="err"
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-5 text-[12px] text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step: email */}
            {step === "email" && (
              <div>
                <h1 className={`text-[24px] font-semibold text-[#1a1410] mb-1 ${playfair.className}`}>Reset password</h1>
                <p className="text-[12.5px] text-[#9B8BAB] mb-6 font-light">
                  Enter your registered email. We'll send a verification code.
                </p>
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1.5">Email Address</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className={FI} placeholder="name@example.com" autoComplete="email" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13px]
                      py-3.5 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]
                      disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Sending code…" : "Send Reset Code"}
                  </button>
                </form>
              </div>
            )}

            {/* Step: otp */}
            {step === "otp" && (
              <div>
                <h1 className={`text-[24px] font-semibold text-[#1a1410] mb-1 ${playfair.className}`}>Check your email</h1>
                <p className="text-[12.5px] text-[#9B8BAB] mb-6 font-light">
                  We sent a 6-digit code to <strong className="text-[#7A2267]">{email}</strong>
                </p>
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1.5">Verification Code</label>
                    <input type="text" inputMode="numeric" maxLength={6}
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className={`${FI} text-center text-[22px] tracking-[0.35em] font-bold`}
                      placeholder="000000" autoComplete="one-time-code" />
                  </div>
                  <button type="submit" disabled={loading || otp.length < 6}
                    className="w-full bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13px]
                      py-3.5 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]
                      disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Verifying…" : "Verify Code"}
                  </button>
                </form>
                <div className="flex items-center justify-between mt-4">
                  <button onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                    className="text-[12px] text-[#9B8BAB] hover:text-[#7A2267] transition-colors font-medium">
                    ← Change email
                  </button>
                  <button onClick={handleResendOtp} disabled={resendCd > 0 || loading}
                    className="text-[12px] text-[#7A2267] font-semibold disabled:opacity-40 hover:underline">
                    {resendCd > 0 ? `Resend in ${resendCd}s` : "Resend code"}
                  </button>
                </div>
              </div>
            )}

            {/* Step: newpass */}
            {step === "newpass" && (
              <div>
                <h1 className={`text-[24px] font-semibold text-[#1a1410] mb-1 ${playfair.className}`}>New password</h1>
                <p className="text-[12.5px] text-[#9B8BAB] mb-6 font-light">Choose a strong new password.</p>
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1.5">New Password</label>
                    <div className="relative">
                      <input type={showPw ? "text" : "password"} required minLength={8}
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className={`${FI} pr-10`} placeholder="At least 8 characters"
                        autoComplete="new-password" />
                      <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4B3CE] hover:text-[#9B8BAB] transition-colors">
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                          <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
                          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading || password.length < 8}
                    className="w-full bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13px]
                      py-3.5 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]
                      disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Saving…" : "Reset Password"}
                  </button>
                </form>
              </div>
            )}

            {/* Step: done */}
            {step === "done" && (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 20 20" width="26" height="26" fill="none">
                    <path d="M5 10l3.5 3.5 6.5-7" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className={`text-[22px] font-semibold text-[#1a1410] mb-2 ${playfair.className}`}>Password reset!</h2>
                <p className="text-[13px] text-[#9B8BAB] mb-6">Your password has been updated successfully.</p>
                <button onClick={() => router.push("/login")}
                  className="w-full bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13px]
                    py-3.5 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]">
                  Sign In
                </button>
              </div>
            )}

            {step !== "done" && (
              <p className="text-center text-[12px] text-[#9B8BAB] mt-6">
                Remember your password?{" "}
                <Link href="/login" className="text-[#7A2267] font-semibold hover:underline">Sign in</Link>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
