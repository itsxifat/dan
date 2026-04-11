"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/actions/authActions";
import {
  AUTH_INLINE_BUTTON,
  AUTH_INPUT,
  AUTH_LABEL,
  AUTH_PRIMARY_BUTTON,
  AuthMessage,
  AuthProgress,
  AuthShell,
  EyeIcon,
} from "@/components/auth/AuthShell";

const STEPS = ["Email", "Verify", "Reset"];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setResendCountdown((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [resendCountdown]);

  async function handleSendOtp(event) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "reset_password" }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send the reset code.");
        return;
      }

      setStep("otp");
      setResendCountdown(60);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCountdown > 0) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "reset_password" }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend the reset code.");
        return;
      }

      setResendCountdown(60);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();

    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp, purpose: "reset_password" }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid code.");
        return;
      }

      setStep("newpass");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await resetPassword({ email, password });
      if (result.error) {
        setError(result.error);
        return;
      }

      setStep("done");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const currentStep = step === "done" ? 2 : { email: 0, otp: 1, newpass: 2 }[step];

  return (
    <AuthShell
      title="Reset password"
      description="Verify your email and set a new password."
      footer={
        step !== "done" ? (
          <p>
            Remember your password?{" "}
            <Link href="/login" className="font-semibold text-[#6E214F] transition hover:text-[#8B2B64] hover:underline">
              Sign in
            </Link>
          </p>
        ) : null
      }
    >
      <AuthProgress currentStep={currentStep} steps={STEPS} />

      <AnimatePresence mode="wait">
        {error && (
          <motion.div key={error} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AuthMessage>{error}</AuthMessage>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === "email" && (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.03em] text-[#1c1512]">Send a reset code</h2>
              <p className="text-[13px] leading-6 text-[#6f645d]">Enter your account email.</p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className={AUTH_LABEL}>Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={AUTH_INPUT}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </div>

              <button type="submit" disabled={loading} className={AUTH_PRIMARY_BUTTON}>
                {loading ? "Sending code..." : "Send reset code"}
              </button>
            </form>
          </motion.div>
        )}

        {step === "otp" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.03em] text-[#1c1512]">Verify your email</h2>
              <p className="text-[13px] leading-6 text-[#6f645d]">Code sent to <span className="font-semibold text-[#6E214F]">{email}</span>.</p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className={AUTH_LABEL}>Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                  className={`${AUTH_INPUT} text-center text-[24px] font-semibold tracking-[0.35em]`}
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
              </div>

              <button type="submit" disabled={loading || otp.length < 6} className={AUTH_PRIMARY_BUTTON}>
                {loading ? "Verifying..." : "Verify code"}
              </button>
            </form>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                }}
                className={AUTH_INLINE_BUTTON}
              >
                Change email
              </button>

              <button type="button" onClick={handleResendOtp} disabled={resendCountdown > 0 || loading} className={AUTH_INLINE_BUTTON}>
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend code"}
              </button>
            </div>
          </motion.div>
        )}

        {step === "newpass" && (
          <motion.div
            key="newpass"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.03em] text-[#1c1512]">Choose a new password</h2>
              <p className="text-[13px] leading-6 text-[#6f645d]">Use at least 8 characters.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className={AUTH_LABEL}>New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`${AUTH_INPUT} pr-11`}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8d85] transition hover:text-[#6E214F]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading || password.length < 8} className={AUTH_PRIMARY_BUTTON}>
                {loading ? "Saving..." : "Reset password"}
              </button>
            </form>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-5 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
              <svg viewBox="0 0 20 20" width="28" height="28" fill="none" aria-hidden="true">
                <path d="M4.8 10.2 8.3 13.7 15.2 6.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-[1.55rem] font-semibold tracking-[-0.03em] text-[#1c1512]">Password updated</h2>
              <p className="text-[13px] leading-6 text-[#6f645d]">You can sign in now.</p>
            </div>

            <button type="button" onClick={() => router.push("/login")} className={AUTH_PRIMARY_BUTTON}>
              Go to sign in
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
