"use client";

import { AnimatePresence, motion } from "framer-motion";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AUTH_INLINE_BUTTON,
  AUTH_INPUT,
  AUTH_LABEL,
  AUTH_PRIMARY_BUTTON,
  AuthDivider,
  AuthGoogleButton,
  AuthMessage,
  AuthShell,
  EyeIcon,
} from "@/components/auth/AuthShell";

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    params.get("error") === "OAuthAccountNotLinked"
      ? "This email is already linked to another sign-in method. Use your password instead."
      : ""
  );
  const [success, setSuccess] = useState(
    params.get("registered") === "true" ? "Account created. Sign in with your email or mobile number." : ""
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const result = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
    });

    if (result?.error) {
      setError(
        result.error.includes("Google")
          ? result.error
          : "Incorrect email, mobile number, or password."
      );
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell
      title="Sign in"
      description="Use email or mobile number."
      footer={
        <p>
          Do not have an account?{" "}
          <Link href="/signup" className="font-semibold text-[#6E214F] transition hover:text-[#8B2B64] hover:underline">
            Create one
          </Link>
        </p>
      }
    >
      <AnimatePresence mode="wait">
        {success && (
          <motion.div key="success" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AuthMessage variant="success">{success}</AuthMessage>
          </motion.div>
        )}
        {error && (
          <motion.div key="error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AuthMessage>{error}</AuthMessage>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthGoogleButton onClick={() => signIn("google", { callbackUrl: "/" })}>
        Continue with Google
      </AuthGoogleButton>

      <AuthDivider label="or use your details" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={AUTH_LABEL}>Email or mobile number</label>
          <input
            type="text"
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            className={AUTH_INPUT}
            placeholder="name@example.com or +8801XXXXXXXXX"
            autoComplete="username"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className={`${AUTH_LABEL} mb-0`}>Password</label>
            <Link href="/forgot-password" className={AUTH_INLINE_BUTTON}>
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${AUTH_INPUT} pr-11`}
              placeholder="Enter your password"
              autoComplete="current-password"
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

        <button type="submit" disabled={loading} className={AUTH_PRIMARY_BUTTON}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
