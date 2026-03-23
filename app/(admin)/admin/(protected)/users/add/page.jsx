"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { addOrPromoteAdmin } from "@/actions/admin/adminActions";
import { ROLE_LABELS } from "@/lib/permissions";
import Link from "next/link";

const ROLE_DESCRIPTIONS = {
  owner:     "Full control over everything, including other admins.",
  admin:     "Can manage users, change roles, and access all admin features.",
  moderator: "Can view and edit user accounts. Limited admin access.",
  viewer:    "Read-only access to the admin panel.",
};

export default function AddAdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const actorRole = session?.user?.role;

  const assignableRoles = actorRole === "owner"
    ? ["owner", "admin", "moderator", "viewer"]
    : ["admin", "moderator", "viewer"];

  const [form, setForm]     = useState({ name: "", email: "", password: "", role: "moderator" });
  const [result, setResult] = useState(null);
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await addOrPromoteAdmin(form);
      setResult(res);
      if (res.action === "created") {
        setForm({ name: "", email: "", password: "", role: "moderator" });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <Link
          href="/admin/users"
          className="p-2 rounded-xl text-white/25 hover:text-white/60
            hover:bg-white/[0.05] transition-all duration-200"
        >
          <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h2 className="text-[11px] uppercase tracking-widest text-white/25 mb-0.5">Access Control</h2>
          <p className="text-[20px] font-light text-white leading-tight">Add Admin User</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.06]
        rounded-xl px-4 py-3.5 mb-6">
        <svg viewBox="0 0 14 14" width="13" height="13" fill="none"
          className="text-[#c05aae] flex-shrink-0 mt-0.5">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 6v4M7 4.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <p className="text-[11px] text-white/40 leading-relaxed">
          If the email belongs to an existing account, their role will be updated.
          Otherwise, a new account will be created — they can log in via Google or set their password later.
        </p>
      </div>

      {/* Form */}
      <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-6">

        {/* Result/error feedback */}
        {result && (
          <div className="flex items-start gap-2.5 bg-emerald-500/8 border border-emerald-500/20
            rounded-xl px-4 py-3 mb-5">
            <svg viewBox="0 0 14 14" width="13" height="13" fill="none"
              className="text-emerald-400 flex-shrink-0 mt-px">
              <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[11px] text-emerald-400 leading-relaxed">{result.message}</p>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20
            rounded-xl px-4 py-3 mb-5">
            <svg viewBox="0 0 14 14" width="13" height="13" fill="none"
              className="text-red-400 flex-shrink-0 mt-px">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 4v3.5M7 10h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <p className="text-[11px] text-red-400 leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role selector */}
          <div>
            <label className="block text-[9.5px] uppercase tracking-widest text-white/30 mb-3 font-medium">
              Role *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {assignableRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update("role", r)}
                  className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border
                    text-left transition-all duration-200
                    ${form.role === r
                      ? "border-[#7A2267]/50 bg-[#7A2267]/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
                    }`}
                >
                  <span className={`text-[10.5px] font-semibold uppercase tracking-wide
                    ${form.role === r ? "text-[#c05aae]" : "text-white/60"}`}>
                    {ROLE_LABELS[r]}
                  </span>
                  <span className="text-[9.5px] text-white/25 leading-snug line-clamp-2">
                    {ROLE_DESCRIPTIONS[r]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[9.5px] uppercase tracking-widest text-white/30 mb-1.5 font-medium">
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
              placeholder="user@example.com"
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl
                px-3.5 py-2.5 text-[12px] text-white placeholder-white/20
                focus:outline-none focus:border-[#7A2267]/40 focus:bg-white/[0.06]
                transition-all duration-200"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-[9.5px] uppercase tracking-widest text-white/30 mb-1.5 font-medium">
              Full Name
              <span className="ml-1.5 text-white/18 normal-case tracking-normal">(required for new users)</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="John Doe"
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl
                px-3.5 py-2.5 text-[12px] text-white placeholder-white/20
                focus:outline-none focus:border-[#7A2267]/40 focus:bg-white/[0.06]
                transition-all duration-200"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[9.5px] uppercase tracking-widest text-white/30 mb-1.5 font-medium">
              Password
              <span className="ml-1.5 text-white/18 normal-case tracking-normal">(optional — can sign in with Google)</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Min 8 characters"
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl
                px-3.5 py-2.5 text-[12px] text-white placeholder-white/20
                focus:outline-none focus:border-[#7A2267]/40 focus:bg-white/[0.06]
                transition-all duration-200"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#7A2267] hover:bg-[#8d2878]
              text-white text-[11px] uppercase tracking-[0.15em] font-semibold
              transition-colors duration-200 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                Processing…
              </span>
            ) : "Grant Admin Access"}
          </button>
        </form>
      </div>
    </div>
  );
}
