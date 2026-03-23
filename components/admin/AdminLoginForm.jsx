"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

const ERROR_MESSAGES = {
  unauthorized: "Your account does not have admin access.",
  suspended:    "Your account has been suspended.",
  OAuthSignin:  "Google sign-in failed. Please try again.",
  OAuthCallback:"Google sign-in failed. Please try again.",
  default:      "Authentication failed. Please try again.",
};

export default function AdminLoginForm({ initialError }) {
  const router  = useRouter();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState(
    initialError ? (ERROR_MESSAGES[initialError] ?? ERROR_MESSAGES.default) : null
  );
  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleCredentials(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error === "CredentialsSignin"
        ? "Invalid email or password."
        : res.error);
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  function handleGoogle() {
    setGoogleLoading(true);
    signIn("google", { callbackUrl: "/admin/dashboard" });
  }

  return (
    <div className={`min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 ${montserrat.className}`}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[500px] h-[500px] rounded-full bg-[#7A2267]/8 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[380px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="Dhali's Amber Nivaas"
            width={100}
            height={32}
            className="object-contain brightness-0 invert opacity-70 mb-4"
            priority
          />
          <h1 className="text-[13px] font-semibold text-white tracking-wide">Admin Portal</h1>
          <p className="text-[10.5px] text-white/30 mt-1 uppercase tracking-widest">Secure Access</p>
        </div>

        {/* Card */}
        <div className="bg-[#111]/90 border border-white/[0.07] rounded-2xl p-7
          shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-500/8 border border-red-500/20
              rounded-xl px-4 py-3">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" className="text-red-400 flex-shrink-0 mt-px">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
                <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <p className="text-[11px] text-red-400 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4
              bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08]
              rounded-xl text-[11.5px] font-medium text-white/70 hover:text-white
              transition-all duration-200 disabled:opacity-50 mb-5"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border border-white/30 border-t-white/70 rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 18 18" width="15" height="15">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <span className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[9.5px] text-white/20 uppercase tracking-widest">or</span>
            <span className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Credentials form */}
          <form onSubmit={handleCredentials} className="space-y-3.5">
            <div>
              <label className="block text-[9.5px] uppercase tracking-widest text-white/30 mb-1.5 font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl
                  px-3.5 py-2.5 text-[12px] text-white placeholder-white/20
                  focus:outline-none focus:border-[#7A2267]/50 focus:bg-white/[0.06]
                  transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-[9.5px] uppercase tracking-widest text-white/30 mb-1.5 font-medium">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl
                  px-3.5 py-2.5 text-[12px] text-white placeholder-white/20
                  focus:outline-none focus:border-[#7A2267]/50 focus:bg-white/[0.06]
                  transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-1 relative overflow-hidden group py-2.5 rounded-xl
                bg-[#7A2267] text-white text-[11px] uppercase tracking-[0.15em] font-semibold
                hover:bg-[#8d2878] transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[9.5px] text-white/15 mt-6">
          Not an admin?{" "}
          <Link href="/login" className="text-white/30 hover:text-white/60 transition-colors">
            Go to user login
          </Link>
        </p>
      </div>
    </div>
  );
}
