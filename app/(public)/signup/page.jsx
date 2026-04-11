"use client";

import { AnimatePresence, motion } from "framer-motion";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/actions/authActions";
import {
  AUTH_INLINE_BUTTON,
  AUTH_INPUT,
  AUTH_LABEL,
  AUTH_PRIMARY_BUTTON,
  AuthDivider,
  AuthGoogleButton,
  AuthMessage,
  AuthProgress,
  AuthShell,
  EyeIcon,
} from "@/components/auth/AuthShell";

const STEPS = ["Details", "Verify", "Password"];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState("info");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in your name, email, and mobile number.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, purpose: "signup" }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send the verification code.");
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
        body: JSON.stringify({ email, phone, purpose: "signup" }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend the verification code.");
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
        body: JSON.stringify({ email, code: otp, purpose: "signup" }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid code.");
        return;
      }

      setStep("password");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await registerUser({ name, email, phone, password });
      if (result.error) {
        setError(result.error);
        return;
      }

      const signInResult = await signIn("credentials", {
        redirect: false,
        identifier: email,
        password,
      });

      if (signInResult?.ok) {
        router.push("/");
        router.refresh();
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = Math.min(4, Math.floor(password.length / 3) + (/[A-Z]/.test(password) ? 1 : 0));
  const currentStep = { info: 0, otp: 1, password: 2 }[step];

  return (
    <AuthShell
      title="Create account"
      description="Name, email and mobile number."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#6E214F] transition hover:text-[#8B2B64] hover:underline">
            Sign in
          </Link>
        </p>
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
        {step === "info" && (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.25 }}
          >
            <AuthGoogleButton onClick={() => signIn("google", { callbackUrl: "/" })}>
              Continue with Google
            </AuthGoogleButton>

            <AuthDivider label="or continue manually" />

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className={AUTH_LABEL}>Full name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={AUTH_INPUT}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>

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

              <div>
                <label className={AUTH_LABEL}>Mobile number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={AUTH_INPUT}
                  placeholder="+8801XXXXXXXXX"
                  autoComplete="tel"
                />
              </div>

              <button type="submit" disabled={loading} className={AUTH_PRIMARY_BUTTON}>
                {loading ? "Sending code..." : "Continue with email"}
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
                  setStep("info");
                  setOtp("");
                  setError("");
                }}
                className={AUTH_INLINE_BUTTON}
              >
                Change details
              </button>

              <button type="button" onClick={handleResendOtp} disabled={resendCountdown > 0 || loading} className={AUTH_INLINE_BUTTON}>
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend code"}
              </button>
            </div>
          </motion.div>
        )}

        {step === "password" && (
          <motion.div
            key="password"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.03em] text-[#1c1512]">Set your password</h2>
              <p className="text-[13px] leading-6 text-[#6f645d]">Use at least 8 characters.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={AUTH_LABEL}>Password</label>
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

                <div className="mt-3 flex gap-2">
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className={`h-1.5 flex-1 rounded-full ${
                        index < passwordStrength
                          ? index < 1
                            ? "bg-red-400"
                            : index < 2
                              ? "bg-amber-400"
                              : index < 3
                                ? "bg-yellow-400"
                                : "bg-emerald-400"
                          : "bg-[#eadfd7]"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading || password.length < 8} className={AUTH_PRIMARY_BUTTON}>
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
