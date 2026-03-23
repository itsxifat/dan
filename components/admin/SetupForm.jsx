"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Montserrat } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { claimOwner } from "@/actions/admin/setupActions";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export default function SetupForm() {
  const [email,   setEmail]   = useState("");
  const [token,   setToken]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await claimOwner({ email, token });
      setSuccess(res.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 ${montserrat.className}`}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[140px]" />
      </div>

      <div className="relative w-full max-w-[400px]">
        {/* Logo + badge */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="Dhali's Amber Nivaas"
            width={100}
            height={32}
            className="object-contain brightness-0 invert opacity-70 mb-4"
            priority
          />
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[9.5px] uppercase tracking-[0.2em] text-amber-400/80 font-semibold">
              First-Run Setup
            </span>
          </div>
          <h1 className="text-[15px] font-semibold text-white">Claim Owner Access</h1>
          <p className="text-[10.5px] text-white/28 mt-1 text-center max-w-[260px] leading-relaxed">
            This page is permanently locked once an owner is assigned.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111]/90 border border-white/[0.07] rounded-2xl p-7
          shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">

          {success ? (
            /* Success state */
            <div className="flex flex-col items-center text-center py-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20
                flex items-center justify-center mb-4">
                <svg viewBox="0 0 20 20" width="20" height="20" fill="none" className="text-emerald-400">
                  <path d="M4 10l4.5 4.5L16 6"
                    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[13px] font-semibold text-white mb-1">
                Welcome, {success}!
              </p>
              <p className="text-[11px] text-white/40 mb-6 leading-relaxed">
                You are now the owner. This setup page is permanently locked.
              </p>
              <button
                onClick={() => signIn(undefined, { callbackUrl: "/admin/dashboard" })}
                className="w-full py-2.5 rounded-xl bg-[#7A2267] hover:bg-[#8d2878]
                  text-white text-[11px] uppercase tracking-[0.15em] font-semibold
                  transition-colors duration-200"
              >
                Go to Admin Panel
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Info */}
              <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/15
                rounded-xl px-3.5 py-3 mb-1">
                <svg viewBox="0 0 14 14" width="13" height="13" fill="none"
                  className="text-amber-400/70 flex-shrink-0 mt-px">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M7 6v3.5M7 4.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <p className="text-[10.5px] text-white/38 leading-relaxed">
                  You must have an existing account first — sign in once via Google or register, then return here.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20
                  rounded-xl px-3.5 py-3">
                  <svg viewBox="0 0 14 14" width="12" height="12" fill="none"
                    className="text-red-400 flex-shrink-0 mt-px">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M7 4v3.5M7 10h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <p className="text-[11px] text-red-400 leading-relaxed">{error}</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[9.5px] uppercase tracking-widest text-white/30 mb-1.5 font-medium">
                  Your Account Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl
                    px-3.5 py-2.5 text-[12px] text-white placeholder-white/20
                    focus:outline-none focus:border-amber-500/30 focus:bg-white/[0.06]
                    transition-all duration-200"
                />
              </div>

              {/* Setup token */}
              <div>
                <label className="block text-[9.5px] uppercase tracking-widest text-white/30 mb-1.5 font-medium">
                  Setup Token
                  <span className="ml-1.5 normal-case tracking-normal text-white/18">
                    (from your .env)
                  </span>
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl
                    px-3.5 py-2.5 text-[12px] text-white placeholder-white/20
                    focus:outline-none focus:border-amber-500/30 focus:bg-white/[0.06]
                    transition-all duration-200"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-2.5 rounded-xl bg-amber-500/80 hover:bg-amber-500
                  text-[#0a0a0a] text-[11px] uppercase tracking-[0.15em] font-bold
                  transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border border-black/20 border-t-black/60
                      rounded-full animate-spin" />
                    Claiming…
                  </span>
                ) : "Claim Ownership"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[9.5px] text-white/15 mt-5">
          Already set up?{" "}
          <Link href="/admin/login" className="text-white/30 hover:text-white/55 transition-colors">
            Go to admin login
          </Link>
        </p>
      </div>
    </div>
  );
}
