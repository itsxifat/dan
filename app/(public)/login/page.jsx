"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Montserrat, Playfair_Display } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const playfair   = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"] });

const FI = `w-full bg-[#FDFCFC] border border-[#EDE5F0] rounded-xl px-4 py-3.5 text-[13.5px]
  text-[#1a1a1a] placeholder:text-[#C4B3CE] outline-none
  focus:border-[#7A2267]/40 focus:shadow-[0_0_0_3px_rgba(122,34,103,0.06)]
  transition-all duration-200`;

export default function LoginPage() {
  const params   = useSearchParams();
  const router   = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState(params.get("error") === "OAuthAccountNotLinked"
    ? "This email is already registered. Please sign in with your password."
    : params.get("registered") ? "" : "");
  const [success,  setSuccess]  = useState(params.get("registered") === "true"
    ? "Account created! Please sign in." : "");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await signIn("credentials", { redirect: false, email, password });
    if (res?.error) {
      setError(
        res.error.includes("Google") ? res.error : "Incorrect email or password."
      );
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

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
            <h1 className={`text-[26px] font-semibold text-[#1a1410] mb-1 ${playfair.className}`}>
              Welcome back
            </h1>
            <p className="text-[12.5px] text-[#9B8BAB] mb-7 font-light">
              Sign in to access your reservations and account.
            </p>

            <AnimatePresence mode="wait">
              {success && (
                <motion.div key="success"
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-5 text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl flex items-center gap-2">
                  <svg viewBox="0 0 12 12" width="13" height="13" fill="none">
                    <circle cx="6" cy="6" r="5.3" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M3.5 6l1.8 1.8 3.2-3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {success}
                </motion.div>
              )}
              {error && (
                <motion.div key="error"
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-5 text-[12px] text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google CTA — highlighted */}
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
                Continue with Google
              </span>
              <span className="text-[10px] font-semibold bg-[#7A2267] text-white px-2 py-0.5 rounded-full ml-1">
                Recommended
              </span>
            </button>

            <div className="relative flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[#EDE5F0]" />
              <span className="text-[10px] text-[#C4B3CE] font-medium uppercase tracking-wider">or continue with email</span>
              <div className="flex-1 h-px bg-[#EDE5F0]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1.5">
                  Email Address
                </label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className={FI} placeholder="name@example.com" autoComplete="email" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold">
                    Password
                  </label>
                  <Link href="/forgot-password"
                    className="text-[11px] text-[#7A2267] font-semibold hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${FI} pr-10`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4B3CE] hover:text-[#9B8BAB] transition-colors">
                    {showPw ? (
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                        <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                        <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13px]
                  py-3.5 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]
                  disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p className="text-center text-[12px] text-[#9B8BAB] mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[#7A2267] font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
